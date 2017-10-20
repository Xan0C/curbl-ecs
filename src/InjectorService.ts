/**
 * Created by Soeren on 18.10.2017.
 */
import {ISystem} from "./System";
import {ECS} from "./ECS";
import {EntityDecoratorComponent} from "./Entity";
import {IComponent} from "./Component";

export class InjectorService {

    private static _instance:InjectorService;
    private static systemQueue:WeakMap<{new(config?:{[x:string]:any}):ISystem},{target:Object,propKey:string|number}>;

    private constructor(){
        InjectorService.systemQueue = new WeakMap();
        ECS.onSystemAdded.add('updateSystemQueue',this);
    }

    public static get instance():InjectorService{
        if(InjectorService._instance){
            return InjectorService._instance;
        }
        return InjectorService._instance = new InjectorService();
    }

    private static updateSystemQueue(system:ISystem):void{
        if(InjectorService.systemQueue.has(system.constructor.prototype)){
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
    public System<T extends ISystem>(system:{new(config?:{[x:string]:any}):T}):(target:Object, propKey:number | string) => void{
        return function(target:Object,propKey:number|string){
            const prop = ECS.getSystem(system);
            if(prop) {
                target[propKey] = prop;
            }else{
                InjectorService.systemQueue.set(system,{target:target,propKey:propKey});
            }
        }
    }

    /**
     * Injects a new Entity into the property
     * @param {EntityDecoratorComponent[]} components
     * @param {boolean} addToECS - if the entity should be added to the ECS default false
     * @returns {(target: Object, propKey: (number | string)) => void}
     * @constructor
     */
    public static Entity(components:EntityDecoratorComponent[],addToECS:boolean=false):(target:Object, propKey:number | string) => void{
        return function(target:Object,propKey:number|string){
            const comps = InjectorService.createComponentsFromDecorator(components);
            target[propKey] = ECS.createEntity(null,comps);
            if(addToECS){
                ECS.addEntity(target[propKey]);
            }
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