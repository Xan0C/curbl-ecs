"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Entity_1 = require("./Entity");
const EntityComponentManager_1 = require("./EntityComponentManager");
const Component_1 = require("./Component");
const System_1 = require("./System");
const EntitySystemManager_1 = require("./EntitySystemManager");
const PropertyDescriptorBinder_1 = require("./PropertyDescriptorBinder");
/**
 * Created by Soeren on 29.06.2017.
 */
class ECS {
    constructor() {
        this.componentBitmaskMap = new Component_1.ComponentBitmaskMap();
        this.ecm = new EntityComponentManager_1.EntityComponentManager(this.componentBitmaskMap);
        this.scm = new EntitySystemManager_1.EntitySystemManager(this.componentBitmaskMap);
        this.propertyDescriptorBinder = new PropertyDescriptorBinder_1.PropertyDescriptorBinder();
        this.registerEvents();
    }
    registerEvents() {
        this.ecm.onEntityAdded.add("onEntityAdded", this);
        this.ecm.onEntityRemoved.add("onEntityRemoved", this);
        this.ecm.onComponentAdded.add("onComponentAdded", this);
        this.ecm.onComponentRemoved.add("onComponentRemoved", this);
        this.scm.onSystemAdded.add("onSystemAdded", this);
    }
    onEntityAdded(entity) {
        ECS.instance.scm.updateEntity(entity);
    }
    onEntityRemoved(entity) {
        ECS.instance.scm.updateEntity(entity);
    }
    onComponentAdded(entity, component) {
        ECS.instance.scm.updateEntity(entity);
    }
    onComponentRemoved(entity, component) {
        ECS.instance.scm.updateEntity(entity);
    }
    onSystemAdded(system) {
        for (let entity of ECS.instance.ecm.entities.values()) {
            ECS.instance.scm.updateEntity(entity, system);
        }
    }
    static get instance() {
        if (ECS._instance) {
            return ECS._instance;
        }
        return ECS._instance = new ECS();
    }
    /**
     * Binds to signals to the PropertyAccessor
     * onPropertySet called each time the property is changed and dispatches the object and propertyKey
     * onPropertyGet called each time the property is accessed and dispatched the object,propertyKey and value
     * @param object
     * @param propertyKey
     * @returns {{onPropertySet: Signal, onPropertyGet: Signal}}
     */
    static bind(object, propertyKey) {
        return ECS.instance.propertyDescriptorBinder.bind(object, propertyKey);
    }
    /**
     * Unbind the Binding to the property
     * @param object
     * @param propertyKey
     * @param restore - default:true restores the previous acessor when the property was binded
     * @returns {boolean}
     */
    static unbind(object, propertyKey, restore) {
        return ECS.instance.propertyDescriptorBinder.unbind(object, propertyKey, restore);
    }
    static noop() { }
    static createEntity(entity, components) {
        return ECS.instance.ecm.createEntity(entity, components);
    }
    static addEntity(entity, components) {
        Entity_1.injectEntity(entity);
        return ECS.instance.ecm.addEntity(entity, components);
    }
    static removeEntity(entity, destroy) {
        return ECS.instance.ecm.removeEntity(entity, destroy);
    }
    static hasEntity(entity) {
        return ECS.instance.ecm.hasEntity(entity);
    }
    static getComponent(entity, component) {
        return ECS.instance.ecm.getComponent(entity, component);
    }
    static getComponents(entity) {
        return ECS.instance.ecm.getComponents(entity);
    }
    static hasComponent(entity, component) {
        return ECS.instance.ecm.hasComponent(entity, component);
    }
    static removeComponent(entity, component) {
        return ECS.instance.ecm.removeComponent(entity, component);
    }
    static addComponent(entity, component) {
        return ECS.instance.ecm.addComponent(entity, component);
    }
    static getEntityComponentMask(entity) {
        return ECS.instance.ecm.getMask(entity);
    }
    static addSystem(system, componentMask) {
        return ECS.instance.scm.add(system, componentMask);
    }
    static addSubsystem(system, subsystem, componentMask) {
        return ECS.instance.scm.addSubsystem(system, subsystem, componentMask);
    }
    static hasSystem(system) {
        return ECS.instance.scm.has(system);
    }
    static hasSystemOf(constructor) {
        return ECS.instance.scm.hasOf(constructor);
    }
    static removeSystem(system) {
        return ECS.instance.scm.remove(system);
    }
    static removeSystemOf(constructor) {
        return ECS.instance.scm.removeOf(constructor);
    }
    static getSystemComponentMask(system) {
        return ECS.instance.scm.getComponentMask(system);
    }
    static getSystemComponentMaskOf(constructor) {
        return ECS.instance.scm.getComponentMaskOf(constructor);
    }
    static removeEntityFromSystem(entity, system) {
        ECS.instance.scm.removeEntity(entity, system);
    }
    static systemHasEntity(system, entity) {
        return ECS.instance.scm.hasEntity(entity, system);
    }
    static getEntitiesForSystem(system) {
        return ECS.instance.scm.getEntities(system);
    }
    static getSystem(constructor) {
        return ECS.instance.scm.get(constructor);
    }
    static getSubsystems(system) {
        return ECS.instance.scm.getSubsystems(system);
    }
    static getSubsystemsOf(constructor) {
        return ECS.instance.scm.getSubsystemsOf(constructor);
    }
    static update() {
        ECS.instance.scm.update();
    }
    static callSystemMethod(func) {
        ECS.instance.scm.callSystemMethod(func);
    }
    static createComponentsFromDecorator(components) {
        let comps = Object.create(null);
        for (let dec of components) {
            comps[dec.component.prototype.constructor.name] = new dec.component(dec.config);
        }
        return comps;
    }
    static Component() {
        return function (constructor) {
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorSystem = function (...args) {
                let component = ECS.instance.ecm.pool.pop(constructor);
                if (!component) {
                    component = wrapper.apply(this, args);
                    Object.setPrototypeOf(component, Object.getPrototypeOf(this));
                    Component_1.injectComponent(component);
                }
                else {
                    component.init(...args);
                }
                return component;
            };
            DecoratorSystem.prototype = constructor.prototype;
            return DecoratorSystem;
        };
    }
    static System(...components) {
        return function (constructor) {
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorSystem = function (...args) {
                let system = wrapper.apply(this, args);
                Object.setPrototypeOf(system, Object.getPrototypeOf(this));
                System_1.injectSystem(system, ECS.instance.scm.systemUpdateMethods);
                ECS.instance.scm.create(system, components);
                return system;
            };
            DecoratorSystem.prototype = constructor.prototype;
            return DecoratorSystem;
        };
    }
    static Entity(...components) {
        return function (...args) {
            switch (args.length) {
                case 1:
                    return ECS.decoratorEntityClass(components).apply(this, args);
                case 2 | 3:
                    if (!args[2]) {
                        return ECS.decoratorEntityProperty(components).apply(this, args);
                    }
                    return;
            }
            return;
        };
    }
    static decoratorEntityClass(components) {
        return function (constructor) {
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorEntity = function (...args) {
                let entity = ECS.instance.ecm.pool.pop(constructor);
                if (!entity) {
                    entity = wrapper.apply(this, args);
                    Object.setPrototypeOf(entity, Object.getPrototypeOf(this));
                    Entity_1.injectEntity(entity);
                }
                ECS.instance.ecm.createEntity(entity, ECS.createComponentsFromDecorator(components));
                return entity;
            };
            DecoratorEntity.prototype = constructor.prototype;
            return DecoratorEntity;
        };
    }
    static decoratorEntityProperty(components) {
        return function (target, propKey) {
            let entity = ECS.instance.ecm.pool.pop(Entity_1.Entity);
            if (!entity) {
                entity = new Entity_1.Entity();
                Entity_1.injectEntity(entity);
            }
            ECS.instance.ecm.createEntity(entity, ECS.createComponentsFromDecorator(components));
            target[propKey] = entity;
        };
    }
    static get uuid() {
        return ECS.instance.ecm.uuid;
    }
    static set uuid(value) {
        ECS.instance.ecm.uuid = value;
    }
    static get onEntityAdded() {
        return ECS.instance.ecm.onEntityAdded;
    }
    static get onEntityRemoved() {
        return ECS.instance.ecm.onEntityRemoved;
    }
    static get onComponentAdded() {
        return ECS.instance.ecm.onComponentAdded;
    }
    static get onComponentRemoved() {
        return ECS.instance.ecm.onComponentRemoved;
    }
    static get onSystemAdded() {
        return ECS.instance.scm.onSystemAdded;
    }
    static get onSystemRemoved() {
        return ECS.instance.scm.onSystemRemoved;
    }
    static get onEntityAddedToSystem() {
        return ECS.instance.scm.onEntityAddedToSystem;
    }
    static get onEntityRemovedFromSystem() {
        return ECS.instance.scm.onEntityRemovedFromSystem;
    }
    static get systemUpdateMethods() {
        return ECS.instance.scm.systemUpdateMethods;
    }
    static set systemUpdateMethods(value) {
        ECS.instance.scm.systemUpdateMethods = value;
    }
}
exports.ECS = ECS;
