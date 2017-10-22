import {injectSystem, ISystem} from "./System";
import {IEntity} from "./Entity";
import {ComponentBitmaskMap} from "./Component";
import {Signal} from "./Signal";
import {spliceOne} from "./util/ArrayUtil";

/**
 * Created by Soeren on 28.06.2017.
 */
export interface IEntitySystemManager {
    readonly onSystemAdded:Signal;
    readonly onSystemRemoved:Signal;
    readonly onEntityAddedToSystem:Signal;
    readonly onEntityRemovedFromSystem:Signal;
    systemUpdateMethods:Array<string>;
    updateSystemMethods():void;
    updateBitmask(system:ISystem, componentMask?:Array<{new(config?:{[x:string]:any}):any}>):ISystem;
    add<T extends ISystem>(system:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>,silent?:boolean):T;
    has(system:ISystem):boolean;
    remove(system:ISystem,silent?:boolean):boolean;
    callSystemMethod(funcId:string);
    update():void;
    hasOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean;
    removeOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T},silent?:boolean):boolean;
    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T;
    getEntitiesOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Array<IEntity>;
    getComponentMaskOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):number;
    addEntity(entity:IEntity,system?:ISystem,silent?:boolean):void;
    removeEntity(entity:IEntity,system?:ISystem,silent?:boolean):void;
    updateEntity(entity:IEntity,system?:ISystem):void;
}

export class EntitySystemManager implements IEntitySystemManager {
    private componentBitmask:ComponentBitmaskMap;
    private _onSystemAdded:Signal;
    private _onSystemRemoved:Signal;
    private _onEntityAddedToSystem:Signal;
    private _onEntityRemovedFromSystem:Signal;

    private ids:Array<string>;
    /**
     * Sorted Array of all Systems
     */
    private systems:{[id:string]:ISystem};

    /**
     * Methods that are called for each system in each iteration
     */
    private _systemUpdateMethods:Array<string>;

    constructor(componentBitmaskMap:ComponentBitmaskMap){
        this._onSystemAdded = new Signal();
        this._onSystemRemoved = new Signal();
        this._onEntityAddedToSystem = new Signal();
        this._onEntityRemovedFromSystem = new Signal();
        this._systemUpdateMethods = ['update'];
        this.componentBitmask = componentBitmaskMap;
        this.systems = Object.create(null);
        this.ids = [];
    }

    /**
     * Creates the System but wont add it to the ECS
     * @param system
     * @param componentMask
     */
    updateBitmask(system:ISystem, componentMask:Array<{new(config?:{[x:string]:any}):any}>=[]):ISystem{
        for(let i = 0, component; component = componentMask[i]; i++){
            system.bitmask = system.bitmask | this.componentBitmask.get(component);
        }
        return system;
    }

    /**
     * Add the system to the ECS so its methods will be called by the update methods
     * Before the existing entities get added into the system the init method is called
     * @param system
     * @param componentMask
     * @param silent
     */
    add<T extends ISystem>(system:T,componentMask:Array<{new(config?:{[x:string]:any}):any}>=[],silent:boolean=false):T{
        if(!this.has(system)) {
            injectSystem(system,this.systemUpdateMethods);
            this.systems[system.constructor.name] = system;
            this.ids.push(system.constructor.name);
            this.updateBitmask(system,componentMask);
            system.setUp();
            if(!silent){
                this._onSystemAdded.dispatch(system);
            }
        }else{
            console.warn('System '+system+' already exists! And can only exists ones');
        }
        return system;
    }

    /**
     * Checks if the system is in the ECS
     * @param system
     * @returns {boolean}
     */
    has(system:ISystem):boolean{
        return !!this.systems[system.constructor.name];
    }

    /**
     * Checks if a system of the class exists in the ECS
     * @param constructor
     * @returns {boolean}
     */
    hasOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean{
        return !!this.systems[constructor.prototype.constructor.name];
    }

    /**
     * Removes the system
     * @param system
     * @param silent
     * @returns {boolean}
     */
    remove(system:ISystem,silent:boolean=false):boolean{
        if(this.has(system)) {
            if(!silent){
                this._onSystemRemoved.dispatch(system);
            }
            system.tearDown();
            spliceOne(this.ids,this.ids.indexOf(system.constructor.name));
            return delete this.systems[system.constructor.name];
        }
        return false;
    }

    /**
     * Removes the System of the provided type from the ECS
     * @param constructor
     * @param silent
     * @returns {boolean}
     */
    removeOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T},silent?:boolean):boolean{
        return this.remove(this.get(constructor),silent);
    }

    /**
     * Returns entities for the system of the type if it exists in the ECS
     * @param constructor
     * @returns {undefined|Map<string, IEntity>}
     */
    getEntitiesOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Array<IEntity>{
        let system = this.get(constructor);
        if(system){
            return system.entities;
        }
        return undefined;
    }

    getComponentMaskOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):number{
        let system = this.get(constructor);
        if(system){
            return system.bitmask;
        }
        return undefined;
    }

    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T{
        return this.systems[constructor.prototype.constructor.name] as T;
    }

    /**
     * Adds the entity to the system, or adds it to all Systems
     * @param entity
     * @param system - optional system to add the entity to
     * @param silent
     */
    addEntity(entity:IEntity,system?:ISystem,silent:boolean=false):void{
        if(system){
            if( (entity.bitmask & system.bitmask) === system.bitmask){
                system.entities.push(entity);
                system.onEntityAdded.dispatch(entity);
            }
        }else{
            const ids = this.ids;
            const systems = this.systems;
            for(let i=0, system; system = systems[ids[i]]; i++){
                if((entity.bitmask & system.bitmask) === system.bitmask){
                    system.entities.push(entity);
                    system.onEntityAdded.dispatch(entity);
                }
            }
        }
        if(!silent && (!system || this.has(system)) ){
            this._onEntityAddedToSystem.dispatch(entity,system);
        }
    }

    /**
     * Removes an entity from the system or all systems
     * @param entity
     * @param system
     * @param silent
     */
    removeEntity(entity:IEntity,system?:ISystem,silent:boolean=false):void{
        if(system){
            spliceOne(system.entities,system.entities.indexOf(entity));
            system.onEntityRemoved.dispatch(entity);
        }else{
            const ids = this.ids;
            const systems = this.systems;
            for(let i=0, system; system = systems[ids[i]]; i++){
                spliceOne(system.entities,system.entities.indexOf(entity));
                system.onEntityRemoved.dispatch(entity);
            }
        }
        if(!silent && (!system || this.has(system)) ){
            this._onEntityRemovedFromSystem.dispatch(entity,system);
        }
    }

    /**
     * Updates the Entity adds it to the right systems and removes if from systems it does not fit anymore
     * @param entity
     * @param system - optional if only update for two Entity(ether add or remove from the system)
     */
    updateEntity(entity:IEntity,system?:ISystem):void{
        if(system){
            this.addEntityToSystem(system,entity);
        }else {
            const ids = this.ids;
            const systems = this.systems;
            for(let i=0, system; system = systems[ids[i]]; i++){
                this.addEntityToSystem(system,entity);
            }
        }
    }

    private addEntityToSystem(system:ISystem,entity:IEntity):void{
        if ((entity.bitmask & system.bitmask) === system.bitmask) {
            if(!system.has(entity)) {
                this.addEntity(entity, system);
            }
        } else if (system.has(entity)) {
            this.removeEntity(entity, system);
        }
    }

    /**
     * Calls the Method for all Systems and Subsystems
     */
    callSystemMethod(id:string) {
        const ids = this.ids;
        const systems = this.systems;
        for(let i=0, system; system = systems[ids[i]]; i++){
            system[id]();
        }
    }

    /**
     * Calls all system update methods for all system and child systems
     */
    update():void {
        for(let i = 0, method; method = this._systemUpdateMethods[i]; i++) {
            this.callSystemMethod(method);
        }
    }

    /**
     * Injects the SystemMethods into all systems if the methods does not exist a noop method will be added
     */
    updateSystemMethods():void{
        const ids = this.ids;
        const systems = this.systems;
        const methods = this.systemUpdateMethods;
        for(let i=0, system; system = systems[ids[i]]; i++){
            injectSystem(system,methods);
        }
    }

    public get onSystemAdded():Signal {
        return this._onSystemAdded;
    }

    public get onSystemRemoved():Signal {
        return this._onSystemRemoved;
    }

    public get onEntityAddedToSystem():Signal {
        return this._onEntityAddedToSystem;
    }

    public get onEntityRemovedFromSystem():Signal {
        return this._onEntityRemovedFromSystem;
    }

    public get systemUpdateMethods():Array<string> {
        return this._systemUpdateMethods;
    }

    public set systemUpdateMethods(value:Array<string>) {
        this._systemUpdateMethods = value;
        this.updateSystemMethods();
    }
}