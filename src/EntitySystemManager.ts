import {ISystem} from "./System";
import {IEntity} from "./Entity";
import {ComponentBitmaskMap} from "./Component";
/**
 * Created by Soeren on 28.06.2017.
 */

export interface IEntitySystemManager {
    add(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>):void;
    has(system:ISystem):boolean;
    remove(system:ISystem):boolean;
    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T;
    getEntities(system:ISystem):Map<string,IEntity>;
    getComponentMask(system:ISystem):number;
    addEntity(entity:IEntity,system?:ISystem):void;
    removeEntity(entity:IEntity,system?:ISystem):void;
    hasEntity(entity:IEntity,system:ISystem):boolean;
}

export class EntitySystemManager implements IEntitySystemManager {
    private componentBitmask:ComponentBitmaskMap;
    private systems:Map<string,ISystem>;
    private systemEntityMap:WeakMap<ISystem,Map<string,IEntity>>;
    private systemComponentMask:WeakMap<ISystem,number>;

    constructor(componentBitmaskMap:ComponentBitmaskMap){
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
    add(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>):void{
        if(!this.systemEntityMap.has(system)) {
            this.systems.set(system.constructor.name,system);
            this.systemEntityMap.set(system, new Map<string, IEntity>());
            this.systemComponentMask.set(system,0);
            for(let component of componentMask){
                this.systemComponentMask.set(system,this.systemComponentMask.get(system) | this.componentBitmask.get(component));
            }
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
     * Removes the system
     * @param system
     * @returns {boolean}
     */
    remove(system:ISystem):boolean{
        this.systemComponentMask.delete(system);
        this.systemEntityMap.delete(system);
        return this.systems.delete(system.constructor.name);
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
     * Return the componentMask of the system
     * @param system
     * @returns {undefined|number}
     */
    getComponentMask(system:ISystem):number{
        return this.systemComponentMask.get(system);
    }

    get<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T{
        return this.systems.get(constructor.prototype.constructor.name) as T;
    }

    /**
     * Adds the entity to the system, or adds it to all Systems
     * @param entity
     * @param system - optional system to add the entity to
     */
    addEntity(entity:IEntity,system?:ISystem):void{
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
     */
    removeEntity(entity:IEntity,system?:ISystem):void{
        if(system){
            this.systemEntityMap.get(system).delete(entity.id);
        }else{
            for(let system of this.systems.values()){
                this.systemEntityMap.get(system).delete(entity.id);
            }
        }
    }
}