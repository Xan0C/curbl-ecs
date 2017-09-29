"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Signal_1 = require("./Signal");
/**
 * Quick and Dirty PropertyBindings wrapping/creating a PropertyDescriptor that
 * dispatched a Signal each time its set or get accessor is called
 */
class PropertyDescriptorBinder {
    constructor() {
        this.propertySignals = new WeakMap();
    }
    /**
     * Creates new PropertyBindings that wrap the previous bindings
     * @param object
     * @param {string} propertyKey
     * @returns {{onPropertySet: Signal; onPropertyGet: Signal}}
     */
    createPropertyBinding(object, propertyKey) {
        let propertyDescriptor = PropertyDescriptorBinder.getPropertyDescriptor(object, propertyKey);
        if (propertyDescriptor && propertyDescriptor.get && propertyDescriptor.set) {
            let onPropertyGet = new Signal_1.Signal();
            let onPropertySet = new Signal_1.Signal();
            this.propertySignals.set(object, new Map());
            this.propertySignals.get(object).set(propertyKey, {
                onPropertySet: onPropertySet,
                onPropertyGet: onPropertyGet,
                propertyKey: propertyKey,
                propertyDescriptor: propertyDescriptor
            });
            Object.defineProperty(object, propertyKey, {
                configurable: propertyDescriptor.configurable,
                enumerable: propertyDescriptor.enumerable,
                get: this.getter(propertyDescriptor, propertyKey),
                set: this.setter(propertyDescriptor, propertyKey)
            });
            let signals = Object.create(null);
            signals.onPropertyGet = onPropertyGet;
            signals.onPropertySet = onPropertySet;
            return signals;
        }
        else {
            throw new Error('Property ' + propertyKey + ' is not a valid property Accessor');
        }
    }
    /**
     * Binds a Property returning signals that are dispatched each time the propety is accessed(get) or changed(set)
     * @param object - Object
     * @param {string} propertyKey - name of the property
     * @returns {{onPropertySet: Signal; onPropertyGet: Signal}} - Signals that are dispatched on PropertyChange
     */
    bind(object, propertyKey) {
        let signals;
        if (this.propertySignals.has(object) && this.propertySignals.get(object).has(propertyKey)) {
            signals = Object.create(null);
            signals.onPropertySet = this.propertySignals.get(object).get(propertyKey).onPropertySet;
            signals.onPropertyGet = this.propertySignals.get(object).get(propertyKey).onPropertyGet;
        }
        else {
            signals = this.createPropertyBinding(object, propertyKey);
        }
        return signals;
    }
    /**
     * Restores the old property descriptor
     * @param object
     * @param {string} propertyKey
     */
    restorePropertyDescriptor(object, propertyKey) {
        let propertyDescriptor = this.propertySignals.get(object).get(propertyKey).propertyDescriptor;
        Object.defineProperty(object, propertyKey, {
            configurable: propertyDescriptor.configurable,
            enumerable: propertyDescriptor.enumerable,
            get: propertyDescriptor.get,
            set: propertyDescriptor.set
        });
    }
    /**
     * Removes the Binding from a property
     * @param object - Object
     * @param {string} propertyKey - name of the property
     * @param {boolean} restore - if the old PropertyDescriptor should be restored {default: true}
     * @returns {boolean}
     */
    unbind(object, propertyKey, restore = true) {
        if (propertyKey && this.propertySignals.has(object) && this.propertySignals.get(object).has(propertyKey)) {
            if (restore) {
                this.restorePropertyDescriptor(object, propertyKey);
            }
            return this.propertySignals.get(object).delete(propertyKey);
        }
        else if (!propertyKey) {
            if (restore) {
                for (let key of this.propertySignals.get(object).keys()) {
                    this.restorePropertyDescriptor(object, key);
                }
            }
            return this.propertySignals.delete(object);
        }
        throw new Error("PropertyKey " + propertyKey + " does not exist");
    }
    /**
     * Creates new PropertyDescriptor wrapping the old PropertyDescriptor and dispatching a Signal each time its called
     * @param {PropertyDescriptor} descriptor
     * @param {string} propertyKey
     * @returns {() => any}
     */
    getter(descriptor, propertyKey) {
        let self = this;
        return function () {
            let val = descriptor.get.apply(this);
            if (self.propertySignals.has(this)) {
                let propBind = self.propertySignals.get(this).get(propertyKey);
                if (propBind) {
                    propBind.onPropertyGet.dispatch(this, propBind.propertyKey, val);
                }
            }
            return val;
        };
    }
    /**
     * Creates new PropertyDescriptor that wraps the setter PropertyDescriptor and dispatched a Signal each time its called
     * @param {PropertyDescriptor} descriptor
     * @param {string} propertyKey
     * @returns {(value: any) => void}
     */
    setter(descriptor, propertyKey) {
        let self = this;
        return function (...args) {
            descriptor.set.apply(this, args);
            if (self.propertySignals.has(this)) {
                let propBind = self.propertySignals.get(this).get(propertyKey);
                if (propBind) {
                    propBind.onPropertySet.dispatch(this, propBind.propertyKey);
                }
            }
        };
    }
    /**
     * Returns the PropertyDescriptor of an Object
     * @param o - Object
     * @param name - name of the property
     * @returns {PropertyDescriptor}
     */
    static getPropertyDescriptor(o, name) {
        let proto = o, descriptor;
        while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, name)))
            proto = proto.__proto__;
        return descriptor;
    }
}
exports.PropertyDescriptorBinder = PropertyDescriptorBinder;
