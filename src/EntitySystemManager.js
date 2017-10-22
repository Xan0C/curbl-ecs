"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const System_1 = require("./System");
const Signal_1 = require("./Signal");
const ArrayUtil_1 = require("./util/ArrayUtil");
class EntitySystemManager {
    constructor(componentBitmaskMap) {
        this._onSystemAdded = new Signal_1.Signal();
        this._onSystemRemoved = new Signal_1.Signal();
        this._onEntityAddedToSystem = new Signal_1.Signal();
        this._onEntityRemovedFromSystem = new Signal_1.Signal();
        this._systemUpdateMethods = ['update'];
        this.componentBitmask = componentBitmaskMap;
        this.systems = Object.create(null);
        this.ids = [];
    }
    /**
     * Creates the System but wont add it to the ECS
     * @param system
     * @param componentMask
     */
    updateBitmask(system, componentMask = []) {
        for (let i = 0, component; component = componentMask[i]; i++) {
            system.bitmask = system.bitmask | this.componentBitmask.get(component);
        }
        return system;
    }
    /**
     * Add the system to the ECS so its methods will be called by the update methods
     * Before the existing entities get added into the system the init method is called
     * @param system
     * @param componentMask
     * @param silent
     */
    add(system, componentMask = [], silent = false) {
        if (!this.has(system)) {
            System_1.injectSystem(system, this.systemUpdateMethods);
            this.systems[system.constructor.name] = system;
            this.ids.push(system.constructor.name);
            this.updateBitmask(system, componentMask);
            system.setUp();
            if (!silent) {
                this._onSystemAdded.dispatch(system);
            }
        }
        else {
            console.warn('System ' + system + ' already exists! And can only exists ones');
        }
        return system;
    }
    /**
     * Checks if the system is in the ECS
     * @param system
     * @returns {boolean}
     */
    has(system) {
        return !!this.systems[system.constructor.name];
    }
    /**
     * Checks if a system of the class exists in the ECS
     * @param constructor
     * @returns {boolean}
     */
    hasOf(constructor) {
        return !!this.systems[constructor.prototype.constructor.name];
    }
    /**
     * Removes the system
     * @param system
     * @param silent
     * @returns {boolean}
     */
    remove(system, silent = false) {
        if (this.has(system)) {
            if (!silent) {
                this._onSystemRemoved.dispatch(system);
            }
            system.tearDown();
            ArrayUtil_1.spliceOne(this.ids, this.ids.indexOf(system.constructor.name));
            return delete this.systems[system.constructor.name];
        }
        return false;
    }
    /**
     * Removes the System of the provided type from the ECS
     * @param constructor
     * @param silent
     * @returns {boolean}
     */
    removeOf(constructor, silent) {
        return this.remove(this.get(constructor), silent);
    }
    /**
     * Returns entities for the system of the type if it exists in the ECS
     * @param constructor
     * @returns {undefined|Map<string, IEntity>}
     */
    getEntitiesOf(constructor) {
        let system = this.get(constructor);
        if (system) {
            return system.entities;
        }
        return undefined;
    }
    getComponentMaskOf(constructor) {
        let system = this.get(constructor);
        if (system) {
            return system.bitmask;
        }
        return undefined;
    }
    get(constructor) {
        return this.systems[constructor.prototype.constructor.name];
    }
    /**
     * Adds the entity to the system, or adds it to all Systems
     * @param entity
     * @param system - optional system to add the entity to
     * @param silent
     */
    addEntity(entity, system, silent = false) {
        if (system) {
            if ((entity.bitmask & system.bitmask) === system.bitmask) {
                system.entities.push(entity);
                system.onEntityAdded.dispatch(entity);
            }
        }
        else {
            const ids = this.ids;
            const systems = this.systems;
            for (let i = 0, system; system = systems[ids[i]]; i++) {
                if ((entity.bitmask & system.bitmask) === system.bitmask) {
                    system.entities.push(entity);
                    system.onEntityAdded.dispatch(entity);
                }
            }
        }
        if (!silent && (!system || this.has(system))) {
            this._onEntityAddedToSystem.dispatch(entity, system);
        }
    }
    /**
     * Removes an entity from the system or all systems
     * @param entity
     * @param system
     * @param silent
     */
    removeEntity(entity, system, silent = false) {
        if (system) {
            ArrayUtil_1.spliceOne(system.entities, system.entities.indexOf(entity));
            system.onEntityRemoved.dispatch(entity);
        }
        else {
            const ids = this.ids;
            const systems = this.systems;
            for (let i = 0, system; system = systems[ids[i]]; i++) {
                ArrayUtil_1.spliceOne(system.entities, system.entities.indexOf(entity));
                system.onEntityRemoved.dispatch(entity);
            }
        }
        if (!silent && (!system || this.has(system))) {
            this._onEntityRemovedFromSystem.dispatch(entity, system);
        }
    }
    /**
     * Updates the Entity adds it to the right systems and removes if from systems it does not fit anymore
     * @param entity
     * @param system - optional if only update for two Entity(ether add or remove from the system)
     */
    updateEntity(entity, system) {
        if (system) {
            this.addEntityToSystem(system, entity);
        }
        else {
            const ids = this.ids;
            const systems = this.systems;
            for (let i = 0, system; system = systems[ids[i]]; i++) {
                this.addEntityToSystem(system, entity);
            }
        }
    }
    addEntityToSystem(system, entity) {
        if ((entity.bitmask & system.bitmask) === system.bitmask) {
            if (!system.has(entity)) {
                this.addEntity(entity, system);
            }
        }
        else if (system.has(entity)) {
            this.removeEntity(entity, system);
        }
    }
    /**
     * Calls the Method for all Systems and Subsystems
     */
    callSystemMethod(id) {
        const ids = this.ids;
        const systems = this.systems;
        for (let i = 0, system; system = systems[ids[i]]; i++) {
            system[id]();
        }
    }
    /**
     * Calls all system update methods for all system and child systems
     */
    update() {
        for (let i = 0, method; method = this._systemUpdateMethods[i]; i++) {
            this.callSystemMethod(method);
        }
    }
    /**
     * Injects the SystemMethods into all systems if the methods does not exist a noop method will be added
     */
    updateSystemMethods() {
        const ids = this.ids;
        const systems = this.systems;
        const methods = this.systemUpdateMethods;
        for (let i = 0, system; system = systems[ids[i]]; i++) {
            System_1.injectSystem(system, methods);
        }
    }
    get onSystemAdded() {
        return this._onSystemAdded;
    }
    get onSystemRemoved() {
        return this._onSystemRemoved;
    }
    get onEntityAddedToSystem() {
        return this._onEntityAddedToSystem;
    }
    get onEntityRemovedFromSystem() {
        return this._onEntityRemovedFromSystem;
    }
    get systemUpdateMethods() {
        return this._systemUpdateMethods;
    }
    set systemUpdateMethods(value) {
        this._systemUpdateMethods = value;
        this.updateSystemMethods();
    }
}
exports.EntitySystemManager = EntitySystemManager;
