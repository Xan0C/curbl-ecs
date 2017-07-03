import {ISystem} from "./System";
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
    add(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>):void;
    has(system:ISystem):boolean;
    remove(system:ISystem):boolean;
    hasOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean;
    removeOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean;
    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T;
    getEntities(system:ISystem):Map<string,IEntity>;
    getEntitiesOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Map<string,IEntity>;
    getComponentMask(system:ISystem):number;
    getComponentMaskOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):number;
    addEntity(entity:IEntity,system?:ISystem):void;
    removeEntity(entity:IEntity,system?:ISystem):void;
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

    constructor(componentBitmaskMap:ComponentBitmaskMap){
        this._onSystemAdded = new Signal();
        this._onSystemRemoved = new Signal();
        this._onEntityAddedToSystem = new Signal();
        this._onEntityRemovedFromSystem = new Signal();
        this.componentBitmask = componentBitmaskMap;
        this.systems = new Map<string,ISystem>();
        this.systemEntityMap = new WeakMap<ISystem,Map<string,IEntity>>();
        this.systemComponentMask = new WeakMap<ISystem,number>();
    }

    /**
     * Add system and the componentmask used for it into the ECS
     * @param system
     * @param componentMask
     */
    add(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>,silent:boolean=false):void{
        if(!this.systems.has(system.constructor.name)) {
            this.systems.set(system.constructor.name,system);
            this.systemEntityMap.set(system, new Map<string, IEntity>());
            this.systemComponentMask.set(system,0);
            for(let component of componentMask){
                this.systemComponentMask.set(system,this.systemComponentMask.get(system) | this.componentBitmask.get(component));
            }
            if(!silent){
                this._onSystemAdded.dispatch(system);
            }
        }else{
            console.warn('System of this type already exists and needs to be removed before adding it again!');
        }
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
        return this.systemEntityMap.has(system);
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
            }
        }else{
            for(let system of this.systems.values()){
                if((entity.componentMask & system.componentMask) === system.componentMask){
                    this.systemEntityMap.get(system).set(entity.id,entity);
                }
            }
        }
        if(!silent){
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
        }else{
            for(let system of this.systems.values()){
                this.systemEntityMap.get(system).delete(entity.id);
            }
        }
        if(!silent){
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
}