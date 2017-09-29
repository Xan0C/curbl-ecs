import {ComponentBitmaskMap, IComponent} from "./Component";
import {DynamicObjectPool} from "./ObjectPool";
import {Entity, IEntity} from "./Entity";
import {UUIDGenerator} from "./UUIDGenerator";
import {Signal} from "./Signal";

export interface IEntityComponentManager {
    readonly pool:DynamicObjectPool;
    readonly onEntityAdded:Signal;
    readonly onEntityRemoved:Signal;
    readonly onComponentAdded:Signal;
    readonly onComponentRemoved:Signal;
    readonly entities:Map<string,IEntity>;
    uuid:()=>string;
    createEntity(entity?:IEntity,components?:{[x:string]:IComponent}):IEntity;
    addEntity<T extends IEntity>(entity:T,components?:{[x:string]:IComponent},silent?:boolean):T;
    removeEntity(entity:IEntity,destroy?:boolean,silent?:boolean):boolean;
    addComponent(entity:IEntity,component:IComponent,silent?:boolean):void;
    hasEntity(entity:IEntity):boolean;
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T},destroy?:boolean,silent?:boolean):boolean;
    getComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):T;
    getComponents(entity:IEntity):{[x:string]:IComponent};
    hasComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):boolean;
    getMask(entity:IEntity):number;
}

/**
 * The EntityComponentManager stores and manages all Entities and their components
 * Entities itself are just empty objects with an id, the Manager maps those ids to the components
 * Its also responsible for adding and removing components from and entity or creating/removing entities
 * By default all Components are stored in an ObjectPool if no longer used instead of being destroyed/gc
 */
export class EntityComponentManager implements IEntityComponentManager {
    /**
     * Stores removed components that are reused
     */
    private _pool:DynamicObjectPool;
    private _onEntityAdded:Signal;
    private _onEntityRemoved:Signal;
    private _onComponentAdded:Signal;
    private _onComponentRemoved:Signal;
    private _uuid:()=>string;
    private componentBitmask:ComponentBitmaskMap;
    /**
     * Maps ids to their Entity
     */
    private _entities:Map<string,IEntity>;
    /**
     * Maps components to their Entity
     */
    private entityComponentMap: WeakMap<IEntity,{[x:string]:IComponent}>;
    /**
     * Stores the ComponentMask for each Entity
     */
    private componentMask:WeakMap<IEntity,number>;

    constructor(componentBitmaskMap:ComponentBitmaskMap,uuid:()=>string=UUIDGenerator.uuid){
        this._pool = new DynamicObjectPool();
        this._onEntityAdded = new Signal();
        this._onEntityRemoved = new Signal();
        this._onComponentAdded = new Signal();
        this._onComponentRemoved = new Signal();
        this._uuid = uuid;
        this.componentBitmask = componentBitmaskMap;
        this._entities = new Map<string,IEntity>();
        this.entityComponentMap = new WeakMap<IEntity,{[x:string]:IComponent}>();
        this.componentMask = new WeakMap<IEntity,number>();
    }

    /**
     * Creates an Entity, adds it to the EntityComponentMap but not to the active entities or actual ECS,
     * so if the entity is deleted/gc it will be removed from the WeakMap
     * @param entity
     * @param components
     */
    createEntity(entity?:IEntity,components?:{[x:string]:IComponent}):IEntity{
        if(!entity){
            entity = this.pool.pop(Entity);
            if(!entity){
                entity = new Entity();
            }
        }
        this.entityComponentMap.set(entity,components||Object.create(null));
        this.componentMask.set(entity,0);
        for(let key in this.entityComponentMap.get(entity)){
            this.componentMask.set(entity,this.componentMask.get(entity)|this.componentBitmask.get(this.entityComponentMap.get(entity)[key].constructor.name));
        }
        return entity;
    }

    /**
     * Adds the Entity with the provided Components(or existing ones) to the ECS,
     * @param entity - Entity to add to the ECS
     * @param components - Components for the entity, if provided this will override the current components of the entity if any
     * @param silent - dispatch the entityAdded signal(If added silent the entity wont be added to an system)
     */
    addEntity<T extends IEntity>(entity:T,components?:{[x:string]:IComponent},silent:boolean=false):T{
        this._entities.set(entity.id,entity);
        let entityComponents = this.entityComponentMap.get(entity);
        this.entityComponentMap.set(entity, components || entityComponents || Object.create(null));
        this.componentMask.set(entity,0);
        for(let key in this.entityComponentMap.get(entity)){
            this.componentMask.set(entity,this.componentMask.get(entity)|this.componentBitmask.get(this.entityComponentMap.get(entity)[key].constructor.name));
        }
        if(!silent) {
            this._onEntityAdded.dispatch(entity);
        }
        return entity;
    }

    /**
     *
     * @param entity - Entity to remove
     * @param destroy - if true the Entity will be destroyed instead of pooled
     * @param silent - Dispatch onEntityRemoved Signal(Removing the Entity from the Systems)
     * @returns {boolean}
     */
    removeEntity(entity:IEntity,destroy?:boolean,silent:boolean=false):boolean{
        if(this.entityComponentMap.has(entity)){
            //TODO: Find a better way to pool the components of an entity
            for(let key in this.entityComponentMap.get(entity)){
                let component = this.entityComponentMap.get(entity)[key];
                this.removeComponent(entity,component.constructor as any,destroy,true);
            }
            if(!destroy) {
                this._pool.push(entity);
            }
            this.componentMask.delete(entity);
            this.entityComponentMap.delete(entity);
            if(!silent && this.entities.has(entity.id)) {
                this._onEntityRemoved.dispatch(entity);
            }
            return this._entities.delete(entity.id);
        }
        return false;
    }

    /**
     * Returns true if the entity is in the ECS
     * @param entity
     * @returns {boolean}
     */
    hasEntity(entity:IEntity):boolean{
        return this._entities.has(entity.id);
    }

    /**
     * Adds a component to the Entity
     * @param entity - Entity
     * @param component - Component to add
     * @param silent - If true this onComponentAdded signal is not dispatched and no system is updated
     */
    addComponent(entity:IEntity,component:IComponent,silent:boolean=false):void{
        if(this.entityComponentMap.has(entity)) {
            this.entityComponentMap.get(entity)[component.constructor.name] = component;
            this.componentMask.set(entity,this.componentMask.get(entity) | this.componentBitmask.get(component.constructor.name));
            if(!silent && this.entities.has(entity.id)) {
                this._onComponentAdded.dispatch(entity, component);
            }
        }
    }

    /**
     * Removes a component from the Entity
     * @param entity - Entity
     * @param component - Component type to remove
     * @param destroy - If true the component is destroyed otherwise its added to the ObjectPool
     * @param silent - If true the onComponentRemoved signal is not dispatched and no system will be updated
     * @returns {boolean}
     */
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T},destroy:boolean=false,silent:boolean=false):boolean{
        if(this.entityComponentMap.has(entity)) {
            let comp = this.entityComponentMap.get(entity)[component.prototype.constructor.name];
            if(comp){
                if(!destroy) {
                    this._pool.push(comp);
                }
                this.componentMask.set(entity,this.componentMask.get(entity) ^ this.componentBitmask.get(component));
                if(!silent && this.entities.has(entity.id)) {
                    this._onComponentRemoved.dispatch(entity, comp);
                }
                comp.remove();
                return delete this.entityComponentMap.get(entity)[component.prototype.constructor.name];
            }
        }
        return false;
    }

    /**
     *
     * @param entity
     * @param component
     * @returns {any}
     */
    getComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):T{
        if(this.entityComponentMap.has(entity)) {
            return this.entityComponentMap.get(entity)[component.prototype.constructor.name] as T;
        }
        return undefined;
    }

    /**
     * Returns an Object with all components this entity contains
     * @param {IEntity} entity
     * @returns {{[p: string]: IComponent}}
     */
    getComponents(entity:IEntity):{[x:string]:IComponent}{
        if(this.entityComponentMap.has(entity)) {
            return this.entityComponentMap.get(entity);
        }
    }

    /**
     *
     * @param entity
     * @param component
     * @returns {boolean}
     */
    hasComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):boolean{
        if(this.entityComponentMap.has(entity)){
            return !!this.entityComponentMap.get(entity)[component.prototype.constructor.name];
        }
        return false;
    }

    /**
     * Return the bitmask for the entity
     * @param entity
     * @returns {number}
     */
    getMask(entity:IEntity):number{
        return this.componentMask.get(entity)||0;
    }

    public get pool():DynamicObjectPool {
        return this._pool;
    }

    public get entities():Map<string, IEntity> {
        return this._entities;
    }

    public get uuid():() => string {
        return this._uuid;
    }

    public set uuid(value:() => string) {
        this._uuid = value;
    }

    public get onEntityAdded():Signal {
        return this._onEntityAdded;
    }

    public get onEntityRemoved():Signal {
        return this._onEntityRemoved;
    }

    public get onComponentAdded():Signal {
        return this._onComponentAdded;
    }

    public get onComponentRemoved():Signal {
        return this._onComponentRemoved;
    }
}