"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS_1 = require("./ECS");
const Signal_1 = require("./Signal");
exports.SYSTEM_PROTOTYPE = {
    setUp: () => { return ECS_1.ECS.noop; },
    tearDown: () => { return ECS_1.ECS.noop; },
    has: () => { return System.prototype.has; },
    remove: () => { return System.prototype.remove; },
    dispose: () => { return System.prototype.dispose; }
};
exports.SYSTEM_PROPERTIES = {
    bitmask: () => { return 0; },
    entities: () => { return []; },
    onEntityAdded: () => { return new Signal_1.Signal(); },
    onEntityRemoved: () => { return new Signal_1.Signal(); }
};
exports.SYSTEM_PROPERTY_DECORATOR = {};
function injectSystem(system, updateMethods) {
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
    for (let i = 0, protoKey; protoKey = updateMethods[i]; i++) {
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
        this.bitmask = exports.SYSTEM_PROPERTIES.bitmask();
        this.entities = exports.SYSTEM_PROPERTIES.entities();
        this.onEntityAdded = exports.SYSTEM_PROPERTIES.onEntityAdded();
        this.onEntityRemoved = exports.SYSTEM_PROPERTIES.onEntityRemoved();
    }
    has(entity) {
        return this.entities.indexOf(entity) !== -1;
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
}
exports.System = System;
