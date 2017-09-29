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
        this._entities = new Map();
        this.entityComponentMap = new WeakMap();
        this.componentMask = new WeakMap();
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
        this.entityComponentMap.set(entity, components || Object.create(null));
        this.componentMask.set(entity, 0);
        for (let key in this.entityComponentMap.get(entity)) {
            this.componentMask.set(entity, this.componentMask.get(entity) | this.componentBitmask.get(this.entityComponentMap.get(entity)[key].constructor.name));
        }
        return entity;
    }
    /**
     * Adds the Entity with the provided Components(or existing ones) to the ECS,
     * @param entity - Entity to add to the ECS
     * @param components - Components for the entity, if provided this will override the current components of the entity if any
     * @param silent - dispatch the entityAdded signal(If added silent the entity wont be added to an system)
     */
    addEntity(entity, components, silent = false) {
        this._entities.set(entity.id, entity);
        let entityComponents = this.entityComponentMap.get(entity);
        this.entityComponentMap.set(entity, components || entityComponents || Object.create(null));
        this.componentMask.set(entity, 0);
        for (let key in this.entityComponentMap.get(entity)) {
            this.componentMask.set(entity, this.componentMask.get(entity) | this.componentBitmask.get(this.entityComponentMap.get(entity)[key].constructor.name));
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
        if (this.entityComponentMap.has(entity)) {
            //TODO: Find a better way to pool the components of an entity
            for (let key in this.entityComponentMap.get(entity)) {
                let component = this.entityComponentMap.get(entity)[key];
                this.removeComponent(entity, component.constructor, destroy, true);
            }
            if (!destroy) {
                this._pool.push(entity);
            }
            this.componentMask.delete(entity);
            this.entityComponentMap.delete(entity);
            if (!silent && this.entities.has(entity.id)) {
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
    hasEntity(entity) {
        return this._entities.has(entity.id);
    }
    /**
     * Adds a component to the Entity
     * @param entity - Entity
     * @param component - Component to add
     * @param silent - If true this onComponentAdded signal is not dispatched and no system is updated
     */
    addComponent(entity, component, silent = false) {
        if (this.entityComponentMap.has(entity)) {
            this.entityComponentMap.get(entity)[component.constructor.name] = component;
            this.componentMask.set(entity, this.componentMask.get(entity) | this.componentBitmask.get(component.constructor.name));
            if (!silent && this.entities.has(entity.id)) {
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
    removeComponent(entity, component, destroy = false, silent = false) {
        if (this.entityComponentMap.has(entity)) {
            let comp = this.entityComponentMap.get(entity)[component.prototype.constructor.name];
            if (comp) {
                if (!destroy) {
                    this._pool.push(comp);
                }
                this.componentMask.set(entity, this.componentMask.get(entity) ^ this.componentBitmask.get(component));
                if (!silent && this.entities.has(entity.id)) {
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
    getComponent(entity, component) {
        if (this.entityComponentMap.has(entity)) {
            return this.entityComponentMap.get(entity)[component.prototype.constructor.name];
        }
        return undefined;
    }
    /**
     * Returns an Object with all components this entity contains
     * @param {IEntity} entity
     * @returns {{[p: string]: IComponent}}
     */
    getComponents(entity) {
        if (this.entityComponentMap.has(entity)) {
            return this.entityComponentMap.get(entity);
        }
    }
    /**
     *
     * @param entity
     * @param component
     * @returns {boolean}
     */
    hasComponent(entity, component) {
        if (this.entityComponentMap.has(entity)) {
            return !!this.entityComponentMap.get(entity)[component.prototype.constructor.name];
        }
        return false;
    }
    /**
     * Return the bitmask for the entity
     * @param entity
     * @returns {number}
     */
    getMask(entity) {
        return this.componentMask.get(entity) || 0;
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
