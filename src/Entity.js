"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS_1 = require("./ECS");
const ENTITY_PROPERTIES = {
    id: () => { return ECS_1.ECS.uuid(); },
    components: () => { return Object.create(null); },
    bitmask: () => { return 0; }
};
const ENTITY_PROTOTYPE = {
    get: () => { return Entity.prototype.get; },
    getAll: () => { return Entity.prototype.getAll; },
    has: () => { return Entity.prototype.has; },
    add: () => { return Entity.prototype.add; },
    remove: () => { return Entity.prototype.remove; },
    dispose: () => { return Entity.prototype.dispose; }
};
exports.ENTITY_PROPERTY_DECORATOR = {};
function injectEntity(entity) {
    for (let propKey in ENTITY_PROPERTIES) {
        if (entity[propKey] === undefined || entity[propKey] === null) {
            entity[propKey] = ENTITY_PROPERTIES[propKey]();
        }
    }
    for (let propKey in exports.ENTITY_PROPERTY_DECORATOR) {
        if (entity[propKey] === undefined || entity[propKey] === null) {
            exports.ENTITY_PROPERTY_DECORATOR[propKey](entity);
        }
    }
    for (let protoKey in ENTITY_PROTOTYPE) {
        if (entity.constructor && entity.constructor.prototype) {
            if (entity.constructor.prototype[protoKey] === undefined || entity.constructor.prototype[protoKey] === null) {
                entity.constructor.prototype[protoKey] = ENTITY_PROTOTYPE[protoKey]();
            }
        }
        else {
            if (entity[protoKey] === undefined || entity[protoKey] === null) {
                entity[protoKey] = ENTITY_PROTOTYPE[protoKey]();
            }
        }
    }
}
exports.injectEntity = injectEntity;
class Entity {
    constructor() {
        this.id = ENTITY_PROPERTIES.id();
        this.components = ENTITY_PROPERTIES.components();
        this.bitmask = ENTITY_PROPERTIES.bitmask();
    }
    getAll() {
        return this.components;
    }
    get(component) {
        return this.components[component.prototype.constructor.name];
    }
    has(component) {
        return !!this.components[component.prototype.constructor.name];
    }
    add(component) {
        return ECS_1.ECS.addComponent(this, component);
    }
    remove(component) {
        return ECS_1.ECS.removeComponent(this, component);
    }
    dispose(destroy) {
        return ECS_1.ECS.removeEntity(this, destroy);
    }
}
exports.Entity = Entity;
