"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ObjectPool_1 = require("./ObjectPool");
const Entity_1 = require("./Entity");
const UUIDGenerator_1 = require("./UUIDGenerator");
const Signal_1 = require("./Signal");
/**
 * The EntityComponentManager stores and manages all Entities and their components
 * Entities itself are just empty objects with an id, the Manager maps those ids to the components
 * Its also responsible for adding and removing components from and entity or creating/removing entities
 * By default all Components are stored in an ObjectPool if no longer used instead of being destroyed/gc
 */
class EntityComponentManager {
    constructor(componentBitmaskMap, uuid = UUIDGenerator_1.UUIDGenerator.uuid) {
        this._pool = new ObjectPool_1.DynamicObjectPool();
        this._onEntityAdded = new Signal_1.Signal();
        this._onEntityRemoved = new Signal_1.Signal();
        this._onComponentAdded = new Signal_1.Signal();
        this._onComponentRemoved = new Signal_1.Signal();
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
    createEntity(entity, components) {
        if (!entity) {
            entity = this.pool.pop(Entity_1.Entity);
            if (!entity) {
                entity = new Entity_1.Entity();
            }
        }
        entity.components = components || Object.create(null);
        entity.bitmask = 0;
        this.updateComponentBitmask(entity);
        return entity;
    }
    updateComponentBitmask(entity) {
        for (let key in entity.components) {
            entity.bitmask = entity.bitmask | this.componentBitmask.get(entity.components[key].constructor.name);
        }
    }
    /**
     * Adds the Entity with the provided Components(or existing ones) to the ECS,
     * @param entity - Entity to add to the ECS
     * @param components - Components for the entity, if provided this will override the current components of the entity if any
     * @param silent - dispatch the entityAdded signal(If added silent the entity wont be added to an system)
     */
    addEntity(entity, components, silent = false) {
        this._entities[entity.id] = entity;
        entity.components = components || entity.components || Object.create(null);
        entity.bitmask = entity.bitmask || 0;
        if (components) {
            this.updateComponentBitmask(entity);
        }
        if (!silent) {
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
    removeEntity(entity, destroy, silent = false) {
        if (this._entities[entity.id]) {
            for (let key in entity.components) {
                this.removeComponent(entity, entity.components[key].constructor, destroy, true);
            }
            if (!destroy) {
                this._pool.push(entity);
            }
            entity.bitmask = 0;
            entity.components = Object.create(null);
            if (!silent && this.hasEntity(entity)) {
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
    hasEntity(entity) {
        return !!this._entities[entity.id];
    }
    /**
     * Adds a component to the Entity
     * @param entity - Entity
     * @param component - Component to add
     * @param silent - If true this onComponentAdded signal is not dispatched and no system is updated
     */
    addComponent(entity, component, silent = false) {
        entity.components[component.constructor.name] = component;
        entity.bitmask = entity.bitmask | this.componentBitmask.get(component.constructor.name);
        if (!silent && this.hasEntity(entity)) {
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
    removeComponent(entity, component, destroy = false, silent = false) {
        let comp = entity.components[component.prototype.constructor.name];
        if (comp) {
            if (!destroy) {
                this._pool.push(comp);
            }
            entity.bitmask = entity.bitmask ^ this.componentBitmask.get(component.prototype.constructor.name);
            if (!silent && this.hasEntity(entity)) {
                this._onComponentRemoved.dispatch(entity, comp);
            }
            comp.remove();
            //TODO: Delete is slow
            return delete entity.components[component.prototype.constructor.name];
        }
        return false;
    }
    get pool() {
        return this._pool;
    }
    get entities() {
        return this._entities;
    }
    get uuid() {
        return this._uuid;
    }
    set uuid(value) {
        this._uuid = value;
    }
    get onEntityAdded() {
        return this._onEntityAdded;
    }
    get onEntityRemoved() {
        return this._onEntityRemoved;
    }
    get onComponentAdded() {
        return this._onComponentAdded;
    }
    get onComponentRemoved() {
        return this._onComponentRemoved;
    }
}
exports.EntityComponentManager = EntityComponentManager;
