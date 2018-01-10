import {ComponentBitmaskMap, IComponent} from "./Component";
import {DynamicObjectPool} from "./ObjectPool";
import {Entity, IEntity, injectEntity} from "./Entity";
import {UUIDGenerator} from "./UUIDGenerator";
import {Signal} from "./Signal";

export interface IEntityComponentManager {
    readonly pool:DynamicObjectPool;
    readonly onEntityAdded:Signal;
    readonly onEntityRemoved:Signal;
    readonly onComponentAdded:Signal;
    readonly onComponentRemoved:Signal;
    readonly entities:{[id:string]:IEntity};
    uuid:()=>string;
    createEntity(entity?:IEntity,components?:{[x:string]:IComponent}):IEntity;
    addEntity<T extends IEntity>(entity:T,components?:{[x:string]:IComponent},silent?:boolean):T;
    removeEntity(entity:IEntity,destroy?:boolean,silent?:boolean):boolean;
    addComponent(entity:IEntity,component:IComponent,silent?:boolean):void;
    hasEntity(entity:IEntity):boolean;
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}|string,destroy?:boolean,silent?:boolean):boolean;
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
    private _entities:{[id:string]:IEntity};

    constructor(componentBitmaskMap:ComponentBitmaskMap,uuid:()=>string=UUIDGenerator.uuid){
        this._pool = new DynamicObjectPool();
        this._onEntityAdded = new Signal();
        this._onEntityRemoved = new Signal();
        this._onComponentAdded = new Signal();
        this._onComponentRemoved = new Signal();
        this._uuid = uuid;
        this.componentBitmask = componentBitmaskMap;
        this._entities = Object.create(null);
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
        entity.components = components||Object.create(null);
        entity.bitmask = 0;
        this.updateComponentBitmask(entity);
        return entity;
    }

    private updateComponentBitmask(entity:IEntity):void{
        for(let key in entity.components){
            entity.bitmask = entity.bitmask|this.componentBitmask.get(entity.components[key].id);
        }
    }

    /**
     * Adds the Entity with the provided Components(or existing ones) to the ECS,
     * @param entity - Entity to add to the ECS
     * @param components - Components for the entity, if provided this will override the current components of the entity if any
     * @param silent - dispatch the entityAdded signal(If added silent the entity wont be added to an system)
     */
    addEntity<T extends IEntity>(entity:T,components?:{[x:string]:IComponent},silent:boolean=false):T{
        this._entities[entity.id] = entity;
        entity.components = components || entity.components || Object.create(null);
        entity.bitmask = entity.bitmask||0;
        if(components) {
            this.updateComponentBitmask(entity);
        }
        if(!silent) {
            this._onEntityAdded.dispatch(entity);
        }
        return entity;
    }

    /**
     * @param entity - Entity to remove
     * @param destroy - if true the Entity will be destroyed instead of pooled
     * @param silent - Dispatch onEntityRemoved Signal(Removing the Entity from the Systems)
     * @returns {boolean}
     */
    removeEntity(entity:IEntity,destroy?:boolean,silent:boolean=false):boolean{
        if(this._entities[entity.id]){
            for(let key in entity.components){
                this.removeComponent(entity,entity.components[key].id,destroy,true);
            }
            if(!destroy){
                this._pool.push(entity);
            }
            entity.bitmask = 0;
            entity.components = Object.create(null);
            if(!silent && this.hasEntity(entity)) {
                this._onEntityRemoved.dispatch(entity);
            }
            return delete this._entities[entity.id];
        }
        return false;
    }

    /**
     * Returns true if the entity is in the ECS
     * @param entity
     * @returns {boolean}
     */
    hasEntity(entity:IEntity):boolean{
        return !!this._entities[entity.id];
    }

    /**
     * Adds a component to the Entity
     * @param entity - Entity
     * @param component - Component to add
     * @param silent - If true this onComponentAdded signal is not dispatched and no system is updated
     */
    addComponent(entity:IEntity,component:IComponent,silent:boolean=false):void{
        entity.components[component.id] = component;
        entity.bitmask = entity.bitmask | this.componentBitmask.get(component.id);
        if(!silent && this.hasEntity(entity)) {
            this._onComponentAdded.dispatch(entity, component);
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
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}|string,destroy:boolean=false,silent:boolean=false):boolean{
        let comp:IComponent;
        if(typeof component === 'string') {
            comp = entity.components[component];
        }else{
            comp = entity.components[component.prototype.constructor.name];
        }
        if(comp){
            if(!destroy){
                this._pool.push(comp);
            }
            entity.bitmask = entity.bitmask ^ this.componentBitmask.get(comp.id);
            if(!silent && this.hasEntity(entity)) {
                this._onComponentRemoved.dispatch(entity, comp);
            }
            comp.remove();
            //TODO: Delete is slow
            return delete entity.components[comp.id];
        }
        return false;
    }

    public get pool():DynamicObjectPool {
        return this._pool;
    }

    public get entities():{ [p:string]:IEntity } {
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