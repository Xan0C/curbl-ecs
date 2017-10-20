"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ECS_1 = require("./ECS");
class InjectorService {
    constructor() {
        InjectorService.systemQueue = new WeakMap();
        ECS_1.ECS.onSystemAdded.add('updateSystemQueue', this);
    }
    static get instance() {
        if (InjectorService._instance) {
            return InjectorService._instance;
        }
        return InjectorService._instance = new InjectorService();
    }
    static updateSystemQueue(system) {
        if (InjectorService.systemQueue.has(system.constructor.prototype)) {
            const inject = InjectorService.systemQueue.get(system.constructor.prototype);
            inject.target[inject.propKey] = system;
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
            const prop = ECS_1.ECS.getSystem(system);
            if (prop) {
                target[propKey] = prop;
            }
            else {
                InjectorService.systemQueue.set(system, { target: target, propKey: propKey });
            }
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
