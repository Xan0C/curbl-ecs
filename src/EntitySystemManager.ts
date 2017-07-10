import {injectSystem, ISystem} from "./System";
import {IEntity} from "./Entity";
import {ComponentBitmaskMap} from "./Component";
import {Signal} from "./Signal";

/**
 * Created by Soeren on 28.06.2017.
 */
export interface IEntitySystemManager {
    readonly onSystemAdded:Signal;
    readonly onSystemRemoved:Signal;
    readonly onEntityAddedToSystem:Signal;
    readonly onEntityRemovedFromSystem:Signal;
    systemUpdateMethods:Array<string>;
    create(system:ISystem,componentMask?:Array<{new(config?:{[x:string]:any}):any}>):ISystem;
    add(system:ISystem,componentMask?:Array<{new(config?:{[x:string]:any}):any}>,silent?:boolean):ISystem;
    has(system:ISystem):boolean;
    remove(system:ISystem,silent?:boolean):boolean;
    callSystemMethod(func:string);
    update():void;
    hasOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean;
    removeOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T},silent?:boolean):boolean;
    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T;
    getEntities(system:ISystem):Map<string,IEntity>;
    getEntitiesOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Map<string,IEntity>;
    getComponentMask(system:ISystem):number;
    getComponentMaskOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):number;
    addEntity(entity:IEntity,system?:ISystem,silent?:boolean):void;
    removeEntity(entity:IEntity,system?:ISystem,silent?:boolean):void;
    hasEntity(entity:IEntity,system:ISystem):boolean;
    updateEntity(entity:IEntity,system?:ISystem):void;
}

export class EntitySystemManager implements IEntitySystemManager {
    private componentBitmask:ComponentBitmaskMap;
    private _onSystemAdded:Signal;
    private _onSystemRemoved:Signal;
    private _onEntityAddedToSystem:Signal;
    private _onEntityRemovedFromSystem:Signal;
    private systems:Map<string,ISystem>;
    private systemEntityMap:WeakMap<ISystem,Map<string,IEntity>>;
    private systemComponentMask:WeakMap<ISystem,number>;
    private _systemUpdateMethods:Array<string>;

    constructor(componentBitmaskMap:ComponentBitmaskMap){
        this._onSystemAdded = new Signal();
        this._onSystemRemoved = new Signal();
        this._onEntityAddedToSystem = new Signal();
        this._onEntityRemovedFromSystem = new Signal();
        this._systemUpdateMethods = ["update"];
        this.componentBitmask = componentBitmaskMap;
        this.systems = new Map<string,ISystem>();
        this.systemEntityMap = new WeakMap<ISystem,Map<string,IEntity>>();
        this.systemComponentMask = new WeakMap<ISystem,number>();
    }

    /**
     * Creates the System but wont add it to the ECS
     * @param system
     * @param componentMask
     */
    create(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>=[]):ISystem{
        if(!this.systemEntityMap.has(system)){
            this.systemEntityMap.set(system, new Map<string, IEntity>());
            this.systemComponentMask.set(system,0);
            for(let component of componentMask){
                this.systemComponentMask.set(system,this.systemComponentMask.get(system) | this.componentBitmask.get(component));
            }
        }
        return system;
    }

    /**
     * Add the system to the ECS so its methods will be called by the update methods
     * Before the existing entities get added into the system the init method is called
     * @param system
     * @param silent
     * @param componentMask
     */
    add(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>=[],silent:boolean=false):ISystem{
        if(!this.systems.has(system.constructor.name)) {
            this.systems.set(system.constructor.name,system);
            this.systemEntityMap.set(system, new Map<string, IEntity>());
            if(componentMask.length > 0) {
                this.systemComponentMask.set(system,0);
                for(let component of componentMask){
                    this.systemComponentMask.set(system,this.systemComponentMask.get(system) | this.componentBitmask.get(component));
                }
            }else{
                this.systemComponentMask.set(system, this.systemComponentMask.get(system) || 0);
            }
            system.init();
            if(!silent){
                this._onSystemAdded.dispatch(system);
            }
        }else{
            console.warn('System '+system+' with same type already exists! And can only exists ones');
        }
        return system;
    }
/*
    addComponentInterest(system:ISystem,component:{new(config?:{[x:string]:any})}):void{
        if(this.systemComponentMask.has(system)) {
            this.systemComponentMask.set(system,this.systemComponentMask.get(system) | this.componentBitmask.get(component));
        }
    }

    removeComponentInterest(system:ISystem,component:{new(config?:{[x:string]:any})}):void{
        if(this.systemComponentMask.has(system)){
            this.systemComponentMask.set(system,this.systemComponentMask.get(system) ^ this.componentBitmask.get(component));
        }
    }
*/

    /**
     * Checks if the is in the ECS
     * @param system
     * @returns {boolean}
     */
    has(system:ISystem):boolean{
        return this.systems.has(system.constructor.name) && this.systemEntityMap.has(system);
    }

    /**
     * Checks if a system of the type exists in the ECS
     * @param constructor
     * @returns {boolean}
     */
    hasOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean{
        return this.systems.has(constructor.prototype.constructor.name);
    }

    /**
     * Removes the system
     * @param system
     * @param silent
     * @returns {boolean}
     */
    remove(system:ISystem,silent:boolean=false):boolean{
        if(this.has(system)) {
            this.systemComponentMask.delete(system);
            this.systemEntityMap.delete(system);
            if(!silent){
                this._onSystemRemoved.dispatch(system);
            }
            return this.systems.delete(system.constructor.name);
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
        return this.remove(this.systems.get(constructor.prototype.constructor.name),silent);
    }

    /**
     * Returns a map of entities for the system
     * @param system
     * @returns {undefined|Map<string, IEntity>}
     */
    getEntities(system:ISystem):Map<string,IEntity>{
        return this.systemEntityMap.get(system);
    }

    /**
     * Returns entities for the system of the type if it exists in the ECS
     * @param constructor
     * @returns {undefined|Map<string, IEntity>}
     */
    getEntitiesOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Map<string,IEntity>{
        let system = this.systems.get(constructor.prototype.constructor.name);
        return this.systemEntityMap.get(system);
    }

    /**
     * Return the componentMask of the system
     * @param system
     * @returns {undefined|number}
     */
    getComponentMask(system:ISystem):number{
        return this.systemComponentMask.get(system);
    }

    getComponentMaskOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):number{
        let system = this.systems.get(constructor.prototype.constructor.name);
        return this.systemComponentMask.get(system);
    }

    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T{
        return this.systems.get(constructor.prototype.constructor.name) as T;
    }

    /**
     * Adds the entity to the system, or adds it to all Systems
     * @param entity
     * @param system - optional system to add the entity to
     * @param silent
     */
    addEntity(entity:IEntity,system?:ISystem,silent:boolean=false):void{
        if(system){
            if( (entity.componentMask & system.componentMask) === system.componentMask){
                this.systemEntityMap.get(system).set(entity.id,entity);
                system.onEntityAdded.dispatch(entity);
            }
        }else{
            for(let system of this.systems.values()){
                if((entity.componentMask & system.componentMask) === system.componentMask){
                    this.systemEntityMap.get(system).set(entity.id,entity);
                    system.onEntityAdded.dispatch(entity);
                }
            }
        }
        if(!silent && (!system || this.has(system)) ){
            this._onEntityAddedToSystem.dispatch(entity,system);
        }
    }

    hasEntity(entity:IEntity,system:ISystem):boolean{
        if(this.has(system)) {
            return this.systemEntityMap.get(system).has(entity.id);
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
            this.systemEntityMap.get(system).delete(entity.id);
            system.onEntityRemoved.dispatch(entity);
        }else{
            for(let system of this.systems.values()){
                this.systemEntityMap.get(system).delete(entity.id);
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
     * @param system - optional if only update for one Entity(ether add or remove from the system)
     */
    updateEntity(entity:IEntity,system?:ISystem):void{
        if(system){
            if ((entity.componentMask & system.componentMask) === system.componentMask) {
                if(!this.hasEntity(entity,system)) {
                    this.addEntity(entity, system);
                }
            } else if (this.hasEntity(entity, system)) {
                this.removeEntity(entity, system);
            }
        }else {
            for (let system of this.systems.values()) {
                if ((entity.componentMask & system.componentMask) === system.componentMask) {
                    if(!this.hasEntity(entity,system)) {
                        this.addEntity(entity, system);
                    }
                } else if (this.hasEntity(entity, system)) {
                    this.removeEntity(entity, system);
                }
            }
        }
    }

    callSystemMethod(func:string) {
        for(let system of this.systems.values()){
            system[func](this.getEntities(system));
        }
    }

    update():void {
        for(let func of this.systemUpdateMethods) {
            for (let system of this.systems.values()) {
                system[func](this.getEntities(system));
            }
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
        for(let system of this.systems.values()){
            injectSystem(system,this.systemUpdateMethods);
        }
    }
}