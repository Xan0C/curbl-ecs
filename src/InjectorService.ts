/**
 * Created by Soeren on 18.10.2017.
 */
import {ISystem} from "./System";
import {ECS} from "./ECS";
import {EntityDecoratorComponent} from "./Entity";
import {IComponent} from "./Component";

export class InjectorService {

    private static _instance:InjectorService;

    private constructor(){}

    public static get instance():InjectorService{
        if(InjectorService._instance){
            return InjectorService._instance;
        }
        return InjectorService._instance = new InjectorService();
    }


    /**
     * Injects an existing system into the property
     * If the system does not exist, the property will be added as soon as the system is added to the ECS
     * @param {{new(config?: {[p: string]: any}) => T}} system
     * @returns {(target: Object, propKey: (number | string)) => void}
     * @constructor
     */
    public System<T extends ISystem>(systems:{[id:string]:{new(...args):T}}):(constructor:{ new(...args):any }) => any{
        return function(constructor:{new(...args):any}){
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorInjector:any = function(...args){
                let object = wrapper.apply(this,args);
                Object.setPrototypeOf(object,Object.getPrototypeOf(this));
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

    private static createComponentsFromDecorator(components:EntityDecoratorComponent[]):{[x:string]:IComponent}{
        let comps = Object.create(null);
        for(let dec of components){
            comps[dec.component.prototype.constructor.name] = new dec.component(dec.config);
        }
        return comps;
    }

}