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
    add<T extends ISystem>(system:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>,silent?:boolean):T;
    addSubsystem<T extends ISystem>(system:ISystem,subsystem:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>,silent?:boolean):T;
    has(system:ISystem):boolean;
    remove(system:ISystem,silent?:boolean):boolean;
    callSystemMethod(func:string);
    update():void;
    hasOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean;
    removeOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T},silent?:boolean):boolean;
    getSubsystemsOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Map<string,ISystem>;
    getSubsystems(system:ISystem):Map<string,ISystem>;
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
    private systemGroups:WeakMap<ISystem,Map<string,ISystem>>;
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
        this.systemGroups = new WeakMap<ISystem,Map<string,ISystem>>();
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
            this.systemEntityMap.set(system,new Map<string, IEntity>());
            this.systemComponentMask.set(system,0);
            this.systemGroups.set(system,new Map<string,ISystem>());
            for(let component of componentMask){
                this.systemComponentMask.set(system,this.systemComponentMask.get(system) | this.componentBitmask.get(component));
            }
        }
        return system;
    }

    /**
     * Adds the System as a Subsystem to the system
     * @param system
     * @param subsystem
     * @param componentMask
     * @param silent
     */
    public addSubsystem<T extends ISystem>(system:ISystem,subsystem:T,componentMask:Array<{new(config?:{[x:string]:any}):any}>=[],silent:boolean=false):T{
        if(this.systems.has(subsystem.constructor.name)){
            this.remove(subsystem);
        }
        this.addSystemToMaps(subsystem,componentMask);
        if(subsystem.parent){
            this.systemGroups.get(subsystem.parent).delete(subsystem.constructor.name);
        }
        subsystem.parent = system;
        this.systemGroups.get(system).set(subsystem.constructor.name,subsystem);
        subsystem.init();
        if(!silent){
            this._onSystemAdded.dispatch(subsystem);
        }
        return subsystem;
    }

    private addSystemToMaps(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>=[]):void{
        this.systemEntityMap.set(system, this.systemEntityMap.get(system) || new Map<string, IEntity>());
        this.systemGroups.set(system,this.systemGroups.get(system) || new Map<string,ISystem>());
        if(componentMask.length > 0) {
            this.systemComponentMask.set(system,0);
            for(let component of componentMask){
                this.systemComponentMask.set(system,this.systemComponentMask.get(system) | this.componentBitmask.get(component));
            }
        }else{
            this.systemComponentMask.set(system, this.systemComponentMask.get(system) || 0);
        }
    }

    /**
     * Add the system to the ECS so its methods will be called by the update methods
     * Before the existing entities get added into the system the init method is called
     * @param system
     * @param componentMask
     * @param silent
     */
    add<T extends ISystem>(system:T,componentMask:Array<{new(config?:{[x:string]:any}):any}>=[],silent:boolean=false):T{
        if(!this.systems.has(system.constructor.name)) {
            this.systems.set(system.constructor.name,system);
            this.addSystemToMaps(system,componentMask);
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
     * Checks if the system is in the ECS
     * @param system
     * @returns {boolean}
     */
    has(system:ISystem):boolean{
        let next = system;
        while(next.parent != undefined){
            next = next.parent;
        }
        return this.systems.has(next.constructor.name) && this.systemEntityMap.has(system);
    }

    /**
     * Checks if a system of the type exists in the ECS
     * @param constructor
     * @returns {boolean}
     */
    hasOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean{
        if(this.systems.has(constructor.prototype.constructor.name)){
            return true;
        }
        for(let system of this.systems.values()) {
            if(this.systemHasOf(system,constructor)){
                return true;
            }
        }
        return false;
    }

    private systemHasOf<T extends ISystem>(system:ISystem,constructor:{new(config?:{[x:string]:any}):T}):boolean{
        if(system.constructor.name === constructor.prototype.constructor.name){
            return true;
        }
        if(!this.systemGroups.has(system)){
            return false;
        }
        for(let child of this.systemGroups.get(system).values()){
            if(this.systemHasOf(child,constructor)){
                return true;
            }
        }
        return false;
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
            this.systemComponentMask.delete(system);
            this.systemEntityMap.delete(system);
            this.systemGroups.delete(system);
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
        return this.remove(this.get(constructor),silent);
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
        let system = this.get(constructor);
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
        let system =this.get(constructor);
        return this.systemComponentMask.get(system);
    }

    getSubsystems(system:ISystem):Map<string,ISystem>{
        return this.systemGroups.get(system);
    }

    getSubsystemsOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Map<string,ISystem>{
        return this.getSubsystems(this.get(constructor));
    }

    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T{
        if(this.systems.has(constructor.prototype.constructor.name)){
            return this.systems.get(constructor.prototype.constructor.name) as T;
        }
        for(let system of this.systems.values()){
            if(this.getOf(system,constructor)){
                return this.getOf(system,constructor) as T;
            }
        }
        return undefined;
    }

    private getOf<T extends ISystem>(system:T,constructor:{new(config?:{[x:string]:any}):T}):T{
        if(system.constructor.name === constructor.prototype.constructor.name){
            return system;
        }
        if(!this.systemGroups.has(system)){
            return undefined;
        }
        for(let child of this.systemGroups.get(system).values()){
            if(this.getOf(child,constructor)){
                return child as T;
            }
        }
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
            this.addEntityToSystem(system,entity);
        }else {
            for (let system of this.systems.values()) {
                this.addEntityToSystem(system,entity);
            }
        }
    }

    private addEntityToSystem(system:ISystem,entity:IEntity):void{
        if ((entity.componentMask & system.componentMask) === system.componentMask) {
            if(!this.hasEntity(entity,system)) {
                this.addEntity(entity, system);
            }
        } else if (this.hasEntity(entity, system)) {
            this.removeEntity(entity, system);
        }
        for(let child of this.systemGroups.get(system).values()){
            this.addEntityToSystem(child,entity);
        }
    }

    /**
     * Calls the Method for all Systems and Subsystems
     * @param func
     */
    callSystemMethod(func:string) {
        for(let system of this.systems.values()){
            system[func](this.getEntities(system));
            for(let child of this.systemGroups.get(system).values()){
                this.updateSystem(func,child);
            }
        }
    }

    /**
     * Calls all system update methods for all system and child systems
     */
    update():void {
        for(let func of this.systemUpdateMethods) {
            this.callSystemMethod(func);
        }
    }

    private updateSystem(func:string,system:ISystem){
        system[func](this.getEntities(system));
        for(let child of this.systemGroups.get(system).values()){
            this.updateSystem(func,child);
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