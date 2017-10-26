"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS_1 = require("./ECS");
class InjectorService {
    constructor() {
        this.systemQueue = Object.create(null);
        ECS_1.ECS.onSystemAdded.add('updateSystemQueue', this);
    }
    static get instance() {
        if (InjectorService._instance) {
            return InjectorService._instance;
        }
        return InjectorService._instance = new InjectorService();
    }
    updateSystemQueue(system) {
        console.log("Check if system exists: " + system);
        console.log(this.systemQueue);
        if (this.systemQueue[system.constructor.name]) {
            console.log("Inject System from Queue: " + system);
            const keys = Object.keys(this.systemQueue);
            for (let i = 0, inject; inject = this.systemQueue[keys[i]]; i++) {
                inject.target[inject.propKey] = system;
            }
            delete this.systemQueue[system.constructor.name];
        }
    }
    /**
     * Injects an existing system into the property
     * If the system does not exist, the property will be added as soon as the system is added to the ECS
     * @param {{new(config?: {[p: string]: any}) => T}} system
     * @returns {(target: Object, propKey: (number | string)) => void}
     * @constructor
     */
    System(system) {
        return function (target, propKey) {
            const constructor = target.constructor;
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let InjectorWrapped = function (...args) {
                let object = wrapper.apply(this, args);
                Object.setPrototypeOf(object, Object.getPrototypeOf(this));
                const prop = ECS_1.ECS.getSystem(system);
                object[propKey] = prop;
                return object;
            };
            InjectorWrapped.prototype = constructor.prototype;
            target.constructor = InjectorWrapped.constructor;
        };
    }
    /**
     * Injects a new Entity into the property
     * @param {EntityDecoratorComponent[]} components
     * @param {boolean} addToECS - if the entity should be added to the ECS default false
     * @returns {(target: Object, propKey: (number | string)) => void}
     * @constructor
     */
    static Entity(components, addToECS = false) {
        return function (target, propKey) {
            const comps = InjectorService.createComponentsFromDecorator(components);
            target[propKey] = ECS_1.ECS.createEntity(null, comps);
            if (addToECS) {
                ECS_1.ECS.addEntity(target[propKey]);
            }
        };
    }
    static createComponentsFromDecorator(components) {
        let comps = Object.create(null);
        for (let dec of components) {
            comps[dec.component.prototype.constructor.name] = new dec.component(dec.config);
        }
        return comps;
    }
}
exports.InjectorService = InjectorService;
