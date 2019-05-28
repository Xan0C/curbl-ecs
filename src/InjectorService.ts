import {ISystem} from "./System";
import {ECS} from "./ECS";

export class InjectorService {

    private static _instance: InjectorService;

    private constructor(){}

    public static get instance(): InjectorService{
        if(InjectorService._instance){
            return InjectorService._instance;
        }
        return InjectorService._instance = new InjectorService();
    }

    /**
     * Injects an existing system into the class
     * @param {{new(config?: {[p: string]: any}) => T}} system
     * @returns {(target: Object, propKey: (number | string)) => void}
     * @constructor
     */
    public System<T extends ISystem>(systems: {[id: string]: {new(...args): T}}): (constructor: { new(...args): any }) => any{
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
}