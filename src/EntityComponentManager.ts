import {ComponentBitmaskMap, Component, injectComponent} from "./Component";
import { Entity, EntityHandle, EntityProp, injectEntity } from './EntityHandle';
import {UUIDGenerator} from "./UUIDGenerator";
import * as EventEmitter from "eventemitter3";
import {ECM_EVENTS, ECM_WORKER_EVENTS} from "./Events";

export interface EntityMap {[id: string]: EntityProp}
/**
 * The EntityComponentManager stores and manages all Entities and their components
 * Its also responsible for adding and removing components from and entity or creating/removing entities
 */
export class EntityComponentManager {
    private readonly _events: EventEmitter;
    private _uuid: () => string;
    private componentBitmask: ComponentBitmaskMap;
    private readonly _entities: {[id: string]: Entity};

    constructor(componentBitmaskMap: ComponentBitmaskMap, events: EventEmitter, uuid: () => string = UUIDGenerator.uuid){
        this._events = events;
        this._uuid = uuid;
        this.componentBitmask = componentBitmaskMap;
        this._entities = Object.create(null);
    }

    /**
     * Creates an Entity, adds it to the list of Entities but does not add it to the actual ECS
     * @param entity
     * @param components
     */
    createEntity<T extends object>(entity?: T | Entity, components?: {[x: string]: Component}): T & EntityHandle {
        if(!entity) {
            entity = new EntityHandle();
        }
        const injectedEntity = injectEntity(entity);
        injectedEntity.components = components || Object.create(null);
        injectedEntity.bitmask = 0;
        this.updateComponentBitmask(injectedEntity);
        return injectedEntity as T & EntityHandle;
    }

    private updateComponentBitmask(entity: Entity): void{
        const keys = Object.keys(entity.components);
        for(let i=0, component; component = entity.components[keys[i]]; i++){
            entity.bitmask = entity.bitmask | this.componentBitmask.get(component.id);
        }
    }

    /**
     * Adds the Entity with the provided Components(or existing ones) to the ECS,
     * @param injectedEntity - Entity to add to the ECS
     * @param components - Components for the entity, if provided this will override the current components of the entity
     * @param silent - dispatch the entityAdded signal(If added silent the entity wont be added to an system)
     * @param silentWorker - do not dispatch entity added worker - used to manage shared entities between WebWorkers
     */
    addEntity<T extends object>(entity: T, components?: {[x: string]: Component}, silent: boolean=false, silentWorker: boolean=false): T & Entity {
        const injectedEntity = injectEntity(entity);
        this._entities[injectedEntity.id] = injectedEntity;
        injectedEntity.components = components || injectedEntity.components || Object.create(null);
        injectedEntity.bitmask = injectedEntity.bitmask || 0;
        this.updateComponentBitmask(injectedEntity);
        if(!silent) {
            this._events.emit(ECM_EVENTS.ENTITY_ADDED, injectedEntity);
        }
        if(!silentWorker) {
            this._events.emit(ECM_WORKER_EVENTS.ENTITY_ADDED, injectedEntity);
        }
        return injectedEntity;
    }

    /**
     * Updates entities, if the entity already exists the old and new components will be merged
     * otherwise the entity will be added as a new entity
     * @param entities
     * @param silent
     * @param silentWorker
     */
    updateEntities(entities: EntityMap, silent?: boolean, silentWorker?: boolean): void {
        const keys = Object.keys(entities);
        for(let i=0, entity: EntityProp; entity = entities[keys[i]]; i++) {
            let components = {
                ...entity.components
            };
            if (this.hasEntity(entity)) {
                components = {
                    ...this._entities[entity.id].components,
                    ...entity.components
                };
            }
            this.addEntity(new EntityHandle(entity.id), components, true);
        }
        if (!silent) {
            this._events.emit(ECM_EVENTS.ENTITIES_UPDATED, entities);
        }
        if(!silentWorker) {
            this._events.emit(ECM_WORKER_EVENTS.ENTITIES_UPDATED, entities);
        }
    }

    /**
     * returns a list of entities that match the given bitmask
     * @param bitmask
     */
    getEntitiesByBitmask(bitmask: number): Entity[] {
        const entities: Entity[] = [];
        const keys = Object.keys(this._entities);
        for(let i=0, entity: Entity; entity = this._entities[keys[i]]; i++){
            if((entity.bitmask & bitmask) === bitmask){
                entities.push(entity);
            }
        }
        return entities;
    }

    /**
     * Return a list of entities with the specified components
     * since we need to check all entities this can be quite slow
     * @param components - list of components the entity needs to have
     */
    getEntities<T extends Entity>(...components: { new(config?: { [p: string]: any }): any }[]): T[] {
        let bitmask = 0;
        for(let i = 0, component; component = components[i]; i++){
            bitmask = bitmask | this.componentBitmask.get(component);
        }
        const keys = Object.keys(this._entities);
        const entities: Entity[] = [];
        for(let i=0, entity: Entity; entity = this._entities[keys[i]]; i++){
            if((entity.bitmask & bitmask) === bitmask){
                entities.push(entity);
            }
        }
        return entities as T[];
    }

    /**
     * @param entity - Entity to remove
     * @param silent - do not dispatch onEntityRemoved Signal(Removing the Entity from the Systems)#
     * @param silentWorker - do not dispatch WorkerEvent
     * @returns {Entity} - the removed Entity
     */
    removeEntity<T extends EntityProp>(entity: T,silent: boolean=false, silentWorker?: boolean): T {
        if(this.hasEntity(entity)){
            if (!silent) {
                this._events.emit(ECM_EVENTS.ENTITY_REMOVED, entity);
            }
            if (!silentWorker) {
                this._events.emit(ECM_WORKER_EVENTS.ENTITY_REMOVED, entity);
            }
            delete this._entities[entity.id];
            return entity;
        }
        return entity;
    }

    /**
     * removes all Entities from the ecs
     */
    removeAllEntities(): Entity[] {
        const entities = [];
        const keys: string[] = Object.keys(this._entities);
        for(let i=0, entity: Entity; entity = this._entities[keys[i]]; i++){
            entities.push(this.removeEntity(entity));
        }
        return entities;
    }

    /**
     * Returns true if the entity is in the ECS
     * @param entity
     * @returns {boolean}
     */
    hasEntity(entity: EntityProp): boolean{
        return !!this._entities[entity.id];
    }

    /**
     * Adds a component to the Entity
     * @param entity - Entity
     * @param component - Component to add
     * @param silent - If true this onComponentAdded signal is not dispatched and no system is updated
     * @param silentWorker - if true no worker signal is dispatched
     */
    addComponent<T extends object>(entity: EntityProp, component: T, silent: boolean=false, silentWorker?: boolean): void {
        const injectedComponent = injectComponent(component);
        entity.components[injectedComponent.id] = injectedComponent;
        entity.bitmask = entity.bitmask | this.componentBitmask.get(injectedComponent.id);
        if(!silent && this.hasEntity(entity)) {
            this._events.emit(ECM_EVENTS.COMPONENT_ADDED, entity, injectedComponent);
        }
        if (!silentWorker && this.hasEntity(entity)) {
            this._events.emit(ECM_WORKER_EVENTS.COMPONENT_ADDED, entity, injectedComponent);
        }
    }

    /**
     * Removes a component from the Entity
     * @param entity - Entity
     * @param component - Component type to remove or the Id
     * @param silent - if true the onComponentRemoved signal is not dispatched and no system will be updated
     * @param silentWorker
     * @returns {boolean}
     */
    removeComponent<T extends Component>(entity: EntityProp, component: {new(...args): T} | string, silent: boolean=false, silentWorker?: boolean): boolean{
        let comp: Component;
        if(typeof component === 'string') {
            comp = entity.components[component];
        }else{
            comp = entity.components[component.prototype.constructor.name];
        }
        if(comp){
            entity.bitmask = entity.bitmask ^ this.componentBitmask.get(comp.id);
            if(!silent && this.hasEntity(entity)) {
                this._events.emit(ECM_EVENTS.COMPONENT_REMOVED, entity, comp);
            }
            if(!silentWorker && this.hasEntity(entity)) {
                this._events.emit(ECM_WORKER_EVENTS.COMPONENT_REMOVED, entity, comp);
            }
            comp.remove();
            return delete entity.components[comp.id];
        }
        return false;
    }

    public get entities(): { [p: string]: Entity } {
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