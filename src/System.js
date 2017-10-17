"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS_1 = require("./ECS");
const Signal_1 = require("./Signal");
exports.SYSTEM_PROTOTYPE = {
    init: () => { return ECS_1.ECS.noop; },
    has: () => { return System.prototype.has; },
    remove: () => { return System.prototype.remove; },
    dispose: () => { return System.prototype.dispose; },
    addSubsystem: () => { return System.prototype.addSubsystem; }
};
exports.SYSTEM_PROPERTIES = {
    parent: () => { return undefined; },
    onEntityAdded: () => { return new Signal_1.Signal(); },
    onEntityRemoved: () => { return new Signal_1.Signal(); }
};
exports.SYSTEM_PROPERTY_DECORATOR = {
    entities: (obj) => {
        Object.defineProperty(obj, "entities", {
            get: function () { return ECS_1.ECS.getEntitiesForSystem(this); }
        });
    },
    componentMask: (obj) => {
        Object.defineProperty(obj, "componentMask", {
            get: function () { return ECS_1.ECS.getSystemComponentMask(this); }
        });
    },
    subsystems: (obj) => {
        Object.defineProperty(obj, "subsystems", {
            get: function () { return ECS_1.ECS.getSubsystems(this); }
        });
    },
};
function injectSystem(system, updateMap) {
    for (let propKey in exports.SYSTEM_PROPERTIES) {
        if (system[propKey] === undefined || system[propKey] === null) {
            system[propKey] = exports.SYSTEM_PROPERTIES[propKey]();
        }
    }
    for (let propKey in exports.SYSTEM_PROPERTY_DECORATOR) {
        if (system[propKey] === undefined || system[propKey] === null) {
            exports.SYSTEM_PROPERTY_DECORATOR[propKey](system);
        }
    }
    for (let protoKey in exports.SYSTEM_PROTOTYPE) {
        if (system.constructor && system.constructor.prototype) {
            if (system.constructor.prototype[protoKey] === undefined || system.constructor.prototype[protoKey] === null) {
                system.constructor.prototype[protoKey] = exports.SYSTEM_PROTOTYPE[protoKey]();
            }
        }
        else {
            if (system[protoKey] === undefined || system[protoKey] === null) {
                system[protoKey] = exports.SYSTEM_PROTOTYPE[protoKey]();
            }
        }
    }
    for (let map of updateMap) {
        if (!map.has(system.constructor.prototype)) {
            map.set(system.constructor.prototype, 'noop');
        }
        const protoKey = map.get(system.constructor.prototype);
        if (system.constructor && system.constructor.prototype) {
            if (system.constructor.prototype[protoKey] === undefined || system.constructor.prototype[protoKey] === null) {
                system.constructor.prototype[protoKey] = ECS_1.ECS.noop;
            }
        }
        else {
            if (system[protoKey] === undefined || system[protoKey] === null) {
                system[protoKey] = ECS_1.ECS.noop;
            }
        }
    }
}
exports.injectSystem = injectSystem;
class System {
    constructor() {
        this.parent = exports.SYSTEM_PROPERTIES.parent();
        this.onEntityAdded = exports.SYSTEM_PROPERTIES.onEntityAdded();
        this.onEntityRemoved = exports.SYSTEM_PROPERTIES.onEntityRemoved();
    }
    addSubsystem(system, componentMask) {
        return ECS_1.ECS.addSubsystem(this, system, componentMask);
    }
    has(entity) {
        return ECS_1.ECS.systemHasEntity(this, entity);
    }
    remove(entity, fromECS = true, destroy) {
        if (fromECS) {
            ECS_1.ECS.removeEntity(entity, destroy);
        }
        ECS_1.ECS.removeEntityFromSystem(entity, this);
    }
    dispose() {
        ECS_1.ECS.removeSystem(this);
    }
    get entities() {
        return ECS_1.ECS.getEntitiesForSystem(this);
    }
    get componentMask() {
        return ECS_1.ECS.getSystemComponentMask(this);
    }
    get subsystems() {
        return ECS_1.ECS.getSubsystems(this);
    }
}
exports.System = System;
