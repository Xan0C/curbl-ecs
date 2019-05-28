import {ComponentBitmaskMap, IComponent, injectComponent} from "./Component";
import {Entity, IEntity, injectEntity} from "./Entity";
import {UUIDGenerator} from "./UUIDGenerator";
import * as EventEmitter from "eventemitter3";
import {ECM_EVENTS} from "./Events";

export interface IEntityComponentManager {
    readonly events: EventEmitter;
    readonly entities: {[id: string]: IEntity};
    uuid: () => string;
    createEntity(entity?: IEntity,components?: {[x: string]: IComponent}): IEntity;
    addEntity<T extends IEntity>(entity: T,components?: {[x: string]: IComponent},silent?: boolean): T;
    getEntities(...components: {new(config?: {[x: string]: any}): any}[]): IEntity[];
    destroyEntity(entity: IEntity, silent?: boolean): boolean;
    destroyAllEntities(): void;
    removeEntity(entity: IEntity,silent?: boolean): IEntity;
    removeAllEntities(): IEntity[];
    addComponent(entity: IEntity, component: IComponent,silent?: boolean): void;
    hasEntity(entity: IEntity): boolean;
    removeComponent<T extends IComponent>(entity: IEntity,component: {new(...args): T}|string, silent?: boolean): boolean;
}

/**
 * The EntityComponentManager stores and manages all Entities and their components
 * Entities itself are just empty objects with an id, the Manager maps those ids to the components
 * Its also responsible for adding and removing components from and entity or creating/removing entities
 * By default all Components are stored in an ObjectPool if no longer used instead of being destroyed/gc
 */
export class EntityComponentManager implements IEntityComponentManager {
    /**
     * Stores removed components and entities that are reused
     * so we do not run out of ids for our entities
     */

    private _events: EventEmitter;
    private _uuid: () => string;
    private componentBitmask: ComponentBitmaskMap;

    /**
     * Maps ids to their Entity
     */
    private _entities: {[id: string]: IEntity};

    constructor(componentBitmaskMap: ComponentBitmaskMap, events: EventEmitter, uuid: () => string=UUIDGenerator.uuid){
        this._events = events;
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
    createEntity(entity?: IEntity,components?: {[x: string]: IComponent}): IEntity{
        if(!entity) {
            entity = new Entity();
        }
        entity.components = components||Object.create(null);
        entity.bitmask = 0;
        this.updateComponentBitmask(entity);
        return entity;
    }

    private updateComponentBitmask(entity: IEntity): void{
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
    addEntity<T extends IEntity>(entity: T,components?: {[x: string]: IComponent},silent: boolean=false): T{
        injectEntity(entity);
        this._entities[entity.id] = entity;
        entity.components = components || entity.components || Object.create(null);
        entity.bitmask = entity.bitmask||0;
        if(components) {
            this.updateComponentBitmask(entity);
        }
        if(!silent) {
            this._events.emit(ECM_EVENTS.ENTITY_ADDED,entity);
        }
        return entity;
    }

    /**
     * Return a list of entities with the specified components
     * since we need to check all entities this can be quite slow
     * @param components - list of components the entity needs to have
     */
    getEntities(...components: { new(config?: { [p: string]: any }): any }[]): IEntity[] {
        let bitmask = 0;
        for(let i = 0, component; component = components[i]; i++){
            bitmask = bitmask | this.componentBitmask.get(component);
        }
        const keys = Object.keys(this._entities);
        const entities: IEntity[] = [];
        for(let i=0, entity: IEntity; entity = this._entities[keys[i]]; i++){
            if((entity.bitmask & bitmask) === bitmask){
                entities.push(entity);
            }
        }
        return entities;
    }

    /**
     * destroys the entity removes it from the manager and deletes all of its components
     * @param entity - entity to destroy
     * @param silent - Dispatch onEntityDestroyed Signal(Removing the Entity from the Systems)
     * @returns {boolean} - true if entity was destroyed from the ecs
     */
    destroyEntity(entity: IEntity, silent: boolean=false): boolean {
        if(this._entities[entity.id]){
            for(let key in entity.components){
                this.removeComponent(entity,entity.components[key].id,true);
            }
            entity.bitmask = 0;
            entity.components = Object.create(null);
            if(!silent && this.hasEntity(entity)) {
                this._events.emit(ECM_EVENTS.ENTITY_DESTROYED,entity);
            }
            return delete this._entities[entity.id];
        }
        return false;
    }

    /**
     * destroy all entities removing all of its components and remove them from the ecs
     * @param pool - if all components and entities should be pooled
     */
    destroyAllEntities(pool?: boolean): void {
        const keys: string[] = Object.keys(this._entities);
        for(let i=0, entity: IEntity; entity = this._entities[keys[i]]; i++){
            this.destroyEntity(entity,pool);
        }
    }

    /**
     * @param entity - Entity to remove
     * @param silent - Dispatch onEntityRemoved Signal(Removing the Entity from the Systems)
     * @returns {boolean} - true if entity got removed from the ecs
     */
    removeEntity(entity: IEntity,silent: boolean=false): IEntity{
        if(this._entities[entity.id]){
            if(!silent && this.hasEntity(entity)) {
                this._events.emit(ECM_EVENTS.ENTITY_REMOVED,entity);
            }
            delete this._entities[entity.id];
            return entity;
        }
        return entity;
    }

    /**
     * removes all Entities from the ecs
     */
    removeAllEntities(): IEntity[] {
        const entities = [];
        const keys: string[] = Object.keys(this._entities);
        for(let i=0, entity: IEntity; entity = this._entities[keys[i]]; i++){
            entities.push(this.removeEntity(entity));
        }
        return entities;
    }

    /**
     * Returns true if the entity is in the ECS
     * @param entity
     * @returns {boolean}
     */
    hasEntity(entity: IEntity): boolean{
        return !!this._entities[entity.id];
    }

    /**
     * Adds a component to the Entity
     * @param entity - Entity
     * @param component - Component to add
     * @param silent - If true this onComponentAdded signal is not dispatched and no system is updated
     */
    addComponent(entity: IEntity,component: IComponent,silent: boolean=false): void{
        injectComponent(component);
        entity.components[component.id] = component;
        entity.bitmask = entity.bitmask | this.componentBitmask.get(component.id);
        if(!silent && this.hasEntity(entity)) {
            this._events.emit(ECM_EVENTS.COMPONENT_ADDED,entity,component);
        }
    }

    /**
     * Removes a component from the Entity
     * @param entity - Entity
     * @param component - Component type to remove
     * @param silent - If true the onComponentRemoved signal is not dispatched and no system will be updated
     * @returns {boolean}
     */
    removeComponent<T extends IComponent>(entity: IEntity, component: {new(...args): T}|string, silent: boolean=false): boolean{
        let comp: IComponent;
        if(typeof component === 'string') {
            comp = entity.components[component];
        }else{
            comp = entity.components[component.prototype.constructor.name];
        }
        if(comp){
            entity.bitmask = entity.bitmask ^ this.componentBitmask.get(comp.id);
            if(!silent && this.hasEntity(entity)) {
                this._events.emit(ECM_EVENTS.COMPONENT_REMOVED,entity,comp);
            }
            comp.remove();
            return delete entity.components[comp.id];
        }
        return false;
    }

    public get entities(): { [p: string]: IEntity } {
        return this._entities;
    }

    public get uuid(): () => string {
        return this._uuid;
    }

    public set uuid(value: () => string) {
        this._uuid = value;
    }

    public get events(): EventEmitter {
        return this._events;
    }
}