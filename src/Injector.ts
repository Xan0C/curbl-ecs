import {ECS} from "./ECS";
import { System } from './System';

export class Injector {

    private static _instance: Injector;

    private constructor(){}

    public static get instance(): Injector{
        if(Injector._instance){
            return Injector._instance;
        }
        return Injector._instance = new Injector();
    }

    /**
     * Injects an existing system into the class
     * @param {{new(config?: {[p: string]: any}) => T}} system
     * @returns {(target: Object, propKey: (number | string)) => void}
     * @constructor
     */
    public System<T extends System>(systems: {[id: string]: {new(...args): T}}): (constructor: { new(...args): any }) => any{
        return function(constructor: {new(...args): any}){
            const wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            const DecoratorInjector: any = function(...args){
                const object = wrapper.apply(this,args);
                ECS.setPrototypeOf(object,Object.getPrototypeOf(this));
                const keys = Object.keys(systems);
                for(let i=0,system; system = systems[keys[i]];i++){
                    object[keys[i]] = ECS.getSystem(system);
                }
                return object;
            };
            DecoratorInjector.prototype = constructor.prototype;
            return DecoratorInjector;
        }
    }

    public static inject<T>(object: object, properties: {[key: string]: () => any}, prototype: {[key: string]: () => (...args) => any}, decorators: {[key: string]: (T) => void}): T {
        for(let propKey in properties){
            if(object[propKey] === undefined || object[propKey] === null){
                object[propKey] = properties[propKey]();
            }
        }
        for(let propKey in decorators){
            if(object[propKey] === undefined || object[propKey] === null){
                decorators[propKey](object);
            }
        }
        for(let protoKey in prototype){
            if(object.constructor && object.constructor.prototype){
                if(object.constructor.prototype[protoKey] === undefined || object.constructor.prototype[protoKey] === null){
                    object.constructor.prototype[protoKey] = prototype[protoKey]();
                }
            }else{
                if(object[protoKey] === undefined || object[protoKey] === null){
                    object[protoKey] = prototype[protoKey]();
                }
            }
        }

        return object as unknown as T;
    }

    public static addNoopMethodsToPrototype(object: any, methods: string[]) {
        for(let i=0, protoKey; protoKey = methods[i]; i++) {
            if (object.constructor && object.constructor.prototype) {
                if (object.constructor.prototype[protoKey] === undefined || object.constructor.prototype[protoKey] === null) {
                    object.constructor.prototype[protoKey] = ECS.noop;
                }
            } else {
                if (object[protoKey] === undefined || object[protoKey] === null) {
                    object[protoKey] = ECS.noop;
                }
            }
        }
    }
}