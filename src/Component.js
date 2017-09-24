"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by Soeren on 27.06.2017.
 */
const ECS_1 = require("./ECS");
class ComponentBitmaskMap {
    constructor() {
        this.bitmaskMap = new Map();
    }
    has(component) {
        if (typeof component === "string") {
            return this.bitmaskMap.has(component);
        }
        else {
            return this.bitmaskMap.has(component.prototype.constructor.name);
        }
    }
    add(component) {
        if (typeof component === "string") {
            this.bitmaskMap.set(component, 1 << this.bitmaskMap.size);
        }
        else {
            this.bitmaskMap.set(component.prototype.constructor.name, 1 << this.bitmaskMap.size);
        }
    }
    get(component) {
        if (!this.has(component)) {
            this.add(component);
        }
        if (typeof component === "string") {
            return this.bitmaskMap.get(component);
        }
        return this.bitmaskMap.get(component.prototype.constructor.name) || 0;
    }
}
exports.ComponentBitmaskMap = ComponentBitmaskMap;
const COMPONENT_PROPERTIES = {};
const COMPONENT_PROTOTYPE = {
    init: () => { return ECS_1.ECS.noop; },
    remove: () => { return ECS_1.ECS.noop; }
};
exports.COMPONENT_PROPERTY_DECORATOR = {};
function injectComponent(component) {
    for (let propKey in COMPONENT_PROPERTIES) {
        if (component[propKey] === undefined || component[propKey] === null) {
            component[propKey] = COMPONENT_PROPERTIES[propKey]();
        }
    }
    for (let propKey in exports.COMPONENT_PROPERTY_DECORATOR) {
        if (component[propKey] === undefined || component[propKey] === null) {
            exports.COMPONENT_PROPERTY_DECORATOR[propKey](component);
        }
    }
    for (let protoKey in COMPONENT_PROTOTYPE) {
        if (component.constructor && component.constructor.prototype) {
            if (component.constructor.prototype[protoKey] === undefined || component.constructor.prototype[protoKey] === null) {
                component.constructor.prototype[protoKey] = COMPONENT_PROTOTYPE[protoKey]();
            }
        }
        else {
            if (component[protoKey] === undefined || component[protoKey] === null) {
                component[protoKey] = COMPONENT_PROTOTYPE[protoKey]();
            }
        }
    }
}
exports.injectComponent = injectComponent;
