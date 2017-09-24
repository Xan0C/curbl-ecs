"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const System_1 = require("./System");
const Signal_1 = require("./Signal");
class EntitySystemManager {
    constructor(componentBitmaskMap) {
        this._onSystemAdded = new Signal_1.Signal();
        this._onSystemRemoved = new Signal_1.Signal();
        this._onEntityAddedToSystem = new Signal_1.Signal();
        this._onEntityRemovedFromSystem = new Signal_1.Signal();
        this._systemUpdateMethods = ["update"];
        this.componentBitmask = componentBitmaskMap;
        this.systems = new Map();
        this.systemGroups = new WeakMap();
        this.systemEntityMap = new WeakMap();
        this.systemComponentMask = new WeakMap();
    }
    /**
     * Creates the System but wont add it to the ECS
     * @param system
     * @param componentMask
     */
    create(system, componentMask = []) {
        if (!this.systemEntityMap.has(system)) {
            this.systemEntityMap.set(system, new Map());
            this.systemComponentMask.set(system, 0);
            this.systemGroups.set(system, new Map());
            for (let component of componentMask) {
                this.systemComponentMask.set(system, this.systemComponentMask.get(system) | this.componentBitmask.get(component));
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
    addSubsystem(system, subsystem, componentMask = [], silent = false) {
        if (this.systems.has(subsystem.constructor.name)) {
            this.remove(subsystem);
        }
        this.addSystemToMaps(subsystem, componentMask);
        if (subsystem.parent) {
            this.systemGroups.get(subsystem.parent).delete(subsystem.constructor.name);
        }
        subsystem.parent = system;
        this.systemGroups.get(system).set(subsystem.constructor.name, subsystem);
        subsystem.init();
        if (!silent) {
            this._onSystemAdded.dispatch(subsystem);
        }
        return subsystem;
    }
    addSystemToMaps(system, componentMask = []) {
        this.systemEntityMap.set(system, this.systemEntityMap.get(system) || new Map());
        this.systemGroups.set(system, this.systemGroups.get(system) || new Map());
        if (componentMask.length > 0) {
            this.systemComponentMask.set(system, 0);
            for (let component of componentMask) {
                this.systemComponentMask.set(system, this.systemComponentMask.get(system) | this.componentBitmask.get(component));
            }
        }
        else {
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
    add(system, componentMask = [], silent = false) {
        if (!this.systems.has(system.constructor.name)) {
            this.systems.set(system.constructor.name, system);
            this.addSystemToMaps(system, componentMask);
            system.init();
            if (!silent) {
                this._onSystemAdded.dispatch(system);
            }
        }
        else {
            console.warn('System ' + system + ' with same type already exists! And can only exists ones');
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
    has(system) {
        let next = system;
        while (next.parent != undefined) {
            next = next.parent;
        }
        return this.systems.has(next.constructor.name) && this.systemEntityMap.has(system);
    }
    /**
     * Checks if a system of the type exists in the ECS
     * @param constructor
     * @returns {boolean}
     */
    hasOf(constructor) {
        if (this.systems.has(constructor.prototype.constructor.name)) {
            return true;
        }
        for (let system of this.systems.values()) {
            if (this.systemHasOf(system, constructor)) {
                return true;
            }
        }
        return false;
    }
    systemHasOf(system, constructor) {
        if (system.constructor.name === constructor.prototype.constructor.name) {
            return true;
        }
        if (!this.systemGroups.has(system)) {
            return false;
        }
        for (let child of this.systemGroups.get(system).values()) {
            if (this.systemHasOf(child, constructor)) {
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
    remove(system, silent = false) {
        if (this.has(system)) {
            if (!silent) {
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
    removeOf(constructor, silent) {
        return this.remove(this.get(constructor), silent);
    }
    /**
     * Returns a map of entities for the system
     * @param system
     * @returns {undefined|Map<string, IEntity>}
     */
    getEntities(system) {
        return this.systemEntityMap.get(system);
    }
    /**
     * Returns entities for the system of the type if it exists in the ECS
     * @param constructor
     * @returns {undefined|Map<string, IEntity>}
     */
    getEntitiesOf(constructor) {
        let system = this.get(constructor);
        return this.systemEntityMap.get(system);
    }
    /**
     * Return the componentMask of the system
     * @param system
     * @returns {undefined|number}
     */
    getComponentMask(system) {
        return this.systemComponentMask.get(system);
    }
    getComponentMaskOf(constructor) {
        let system = this.get(constructor);
        return this.systemComponentMask.get(system);
    }
    getSubsystems(system) {
        return this.systemGroups.get(system);
    }
    getSubsystemsOf(constructor) {
        return this.getSubsystems(this.get(constructor));
    }
    get(constructor) {
        if (this.systems.has(constructor.prototype.constructor.name)) {
            return this.systems.get(constructor.prototype.constructor.name);
        }
        for (let system of this.systems.values()) {
            if (this.getOf(system, constructor)) {
                return this.getOf(system, constructor);
            }
        }
        return undefined;
    }
    getOf(system, constructor) {
        if (system.constructor.name === constructor.prototype.constructor.name) {
            return system;
        }
        if (!this.systemGroups.has(system)) {
            return undefined;
        }
        for (let child of this.systemGroups.get(system).values()) {
            if (this.getOf(child, constructor)) {
                return child;
            }
        }
    }
    /**
     * Adds the entity to the system, or adds it to all Systems
     * @param entity
     * @param system - optional system to add the entity to
     * @param silent
     */
    addEntity(entity, system, silent = false) {
        if (system) {
            if ((entity.componentMask & system.componentMask) === system.componentMask) {
                this.systemEntityMap.get(system).set(entity.id, entity);
                system.onEntityAdded.dispatch(entity);
            }
        }
        else {
            for (let system of this.systems.values()) {
                if ((entity.componentMask & system.componentMask) === system.componentMask) {
                    this.systemEntityMap.get(system).set(entity.id, entity);
                    system.onEntityAdded.dispatch(entity);
                }
            }
        }
        if (!silent && (!system || this.has(system))) {
            this._onEntityAddedToSystem.dispatch(entity, system);
        }
    }
    hasEntity(entity, system) {
        if (this.has(system)) {
            return this.systemEntityMap.get(system).has(entity.id);
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
            this.systemEntityMap.get(system).delete(entity.id);
            system.onEntityRemoved.dispatch(entity);
        }
        else {
            for (let system of this.systems.values()) {
                this.systemEntityMap.get(system).delete(entity.id);
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
            for (let system of this.systems.values()) {
                this.addEntityToSystem(system, entity);
            }
        }
    }
    addEntityToSystem(system, entity) {
        if ((entity.componentMask & system.componentMask) === system.componentMask) {
            if (!this.hasEntity(entity, system)) {
                this.addEntity(entity, system);
            }
        }
        else if (this.hasEntity(entity, system)) {
            this.removeEntity(entity, system);
        }
        for (let child of this.systemGroups.get(system).values()) {
            this.addEntityToSystem(child, entity);
        }
    }
    /**
     * Calls the Method for all Systems and Subsystems
     * @param func
     */
    callSystemMethod(func) {
        for (let system of this.systems.values()) {
            system[func](this.getEntities(system));
            for (let child of this.systemGroups.get(system).values()) {
                this.updateSystem(func, child);
            }
        }
    }
    /**
     * Calls all system update methods for all system and child systems
     */
    update() {
        for (let func of this.systemUpdateMethods) {
            this.callSystemMethod(func);
        }
    }
    updateSystem(func, system) {
        system[func](this.getEntities(system));
        for (let child of this.systemGroups.get(system).values()) {
            this.updateSystem(func, child);
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
        for (let system of this.systems.values()) {
            System_1.injectSystem(system, this.systemUpdateMethods);
        }
    }
}
exports.EntitySystemManager = EntitySystemManager;
