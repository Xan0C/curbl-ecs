import {Entity, EntityDecoratorComponent, IEntity, injectEntity} from "./Entity";
import {EntityComponentManager, IEntityComponentManager} from "./EntityComponentManager";
import {ComponentBitmaskMap, IComponent} from "./Component";
import {injectSystem, ISystem} from "./System";
import {EntitySystemManager, IEntitySystemManager} from "./EntitySystemManager";
import {Signal} from "./Signal";
/**
 * Created by Soeren on 29.06.2017.
 */

export class ECS {

    private static _instance:ECS;
    private ecm:IEntityComponentManager;
    private scm:IEntitySystemManager;
    private componentBitmaskMap:ComponentBitmaskMap;

    private constructor(){
        this.componentBitmaskMap = new ComponentBitmaskMap();
        this.ecm = new EntityComponentManager(this.componentBitmaskMap);
        this.scm = new EntitySystemManager(this.componentBitmaskMap);
        this.registerEvents();
    }

    private registerEvents(){
        this.ecm.onEntityAdded.add("onEntityAdded",this);
        this.ecm.onEntityRemoved.add("onEntityRemoved",this);
        this.ecm.onComponentAdded.add("onComponentAdded",this);
        this.ecm.onComponentRemoved.add("onComponentRemoved",this);

        this.scm.onSystemAdded.add("onSystemAdded",this);
    }

    private onEntityAdded(entity:IEntity){
        ECS.instance.scm.updateEntity(entity);
    }

    private onEntityRemoved(entity:IEntity){
        ECS.instance.scm.updateEntity(entity);
    }

    private onComponentAdded(entity:IEntity,component:IComponent){
        ECS.instance.scm.updateEntity(entity);
    }

    private onComponentRemoved(entity:IEntity,component:IComponent){
        ECS.instance.scm.updateEntity(entity);
    }

    private onSystemAdded(system:ISystem){
        for(let entity of ECS.instance.ecm.entities.values()){
            ECS.instance.scm.updateEntity(entity,system);
        }
    }

    private static get instance():ECS{
        if(ECS._instance){
            return ECS._instance;
        }
        return ECS._instance = new ECS();
    }

    static createEntity():IEntity{
        let entity = ECS.instance.ecm.pool.pop(Entity);
        if(!entity){
            entity = new Entity();
        }
        return entity;
    }

    static addEntity(entity:IEntity,components?:{[x:string]:IComponent}):void{
        injectEntity(entity);
        ECS.instance.ecm.addEntity(entity,components);
    }

    static removeEntity(entity:IEntity,destroy?:boolean):boolean{
        return ECS.instance.ecm.removeEntity(entity,destroy);
    }

    static hasEntity(entity:IEntity):boolean{
        return ECS.instance.ecm.hasEntity(entity);
    }

    static getComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):T{
        return ECS.instance.ecm.getComponent(entity,component);
    }

    static hasComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):boolean{
        return ECS.instance.ecm.hasComponent(entity,component);
    }

    static removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):boolean{
        return ECS.instance.ecm.removeComponent(entity,component);
    }

    static addComponent(entity:IEntity,component:IComponent):void{
        return ECS.instance.ecm.addComponent(entity,component);
    }

    static getEntityComponentMask(entity:IEntity):number{
        return ECS.instance.ecm.getMask(entity);
    }

    static addSystem(system:ISystem,componentMask:Array<{new(config?:{[x:string]:any}):any}>):void{
        ECS.instance.scm.add(system,componentMask);
    }

    static hasSystem(system:ISystem):boolean{
        return ECS.instance.scm.has(system);
    }

    static hasSystemOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean{
        return ECS.instance.scm.hasOf(constructor);
    }

    static removeSystem(system:ISystem):boolean{
        return ECS.instance.scm.remove(system);
    }

    static removeSystemOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):boolean{
        return ECS.instance.scm.removeOf(constructor);
    }

    static getSystemComponentMask(system:ISystem):number{
        return ECS.instance.scm.getComponentMask(system);
    }

    static getSystemComponentMaskOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):number{
        return ECS.instance.scm.getComponentMaskOf(constructor);
    }

    static removeEntityFromSystem(entity:IEntity,system?:ISystem):void{
        ECS.instance.scm.removeEntity(entity,system);
    }

    static systemHasEntity(system:ISystem,entity:IEntity):boolean{
        return ECS.instance.scm.hasEntity(entity,system);
    }

    static getEntitiesForSystem(system:ISystem):Map<string,IEntity>{
        return ECS.instance.scm.getEntities(system);
    }

    static getSystem<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T{
        return ECS.instance.scm.get(constructor);
    }

    private static createComponentsFromDecorator(components:EntityDecoratorComponent[]):{[x:string]:IComponent}{
        let comps = Object.create(null);
        for(let dec of components){
            comps[dec.component.prototype.constructor.name] = new dec.component(dec.config);
        }
        return comps;
    }

    static System(...components:{new(config?:{[x:string]:any}):any}[]):(constructor:{ new(config?:{[x:string]:any}):ISystem }) => any{
        return function(constructor:{new(...args):ISystem}){
            var wrapper = function (args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorSystem:any = function(...args){
                let system = wrapper.apply(this,args);
                Object.setPrototypeOf(system,Object.getPrototypeOf(this));
                injectSystem(system);
                ECS.instance.scm.add(system,components);
                return system;
            };
            DecoratorSystem.prototype = constructor.prototype;
            return DecoratorSystem;
        }
    }

    static Entity(...components:EntityDecoratorComponent[]):((constructor:{ new(config?:{[x:string]:any}):IEntity }) => any)&((target:Object, propKey:number | string) => void)  {
        return function (...args:any[]) {
            switch (args.length) {
                case 1:
                    return ECS.decoratorEntityClass(components).apply(this,args);
                case 2 | 3:
                    if(!args[2]) {
                        return ECS.decoratorEntityProperty(components).apply(this,args);
                    }
                    return;
            }
            return;
        }
    }

    private static decoratorEntityClass(components:EntityDecoratorComponent[]):(constructor:{ new(...args):IEntity }) => any{
        return function(constructor:{new(...args):IEntity}){
            var wrapper = function (args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorEntity:any = function(...args){
                let entity = ECS.instance.ecm.pool.pop(constructor);
                if(!entity){
                    entity = wrapper.apply(this,args);
                    Object.setPrototypeOf(entity,Object.getPrototypeOf(this));
                    injectEntity(entity);
                }
                ECS.instance.ecm.addEntity(entity,ECS.createComponentsFromDecorator(components));
                return entity;
            };
            DecoratorEntity.prototype = constructor.prototype;
            return DecoratorEntity;
        }
    }

    private static decoratorEntityProperty(components:EntityDecoratorComponent[]):(target:Object, propKey:number | string) => void{
        return function(target:Object,propKey:number|string){
            let entity = ECS.instance.ecm.pool.pop(Entity);
            if(!entity){
                entity = new Entity();
                injectEntity(entity);
            }
            ECS.instance.ecm.addEntity(entity,ECS.createComponentsFromDecorator(components));
            target[propKey] = entity;
        }
    }

    static get uuid():()=>string{
        return ECS.instance.ecm.uuid;
    }

    static set uuid(value:()=>string){
        ECS.instance.ecm.uuid = value;
    }

    static get onEntityAdded():Signal{
        return ECS.instance.ecm.onEntityAdded;
    }

    static get onEntityRemoved():Signal{
        return ECS.instance.ecm.onEntityRemoved;
    }

    static get onComponentAdded():Signal{
        return ECS.instance.ecm.onComponentAdded;
    }

    static get onComponentRemoved():Signal{
        return ECS.instance.ecm.onComponentRemoved;
    }

    static get onSystemAdded():Signal{
        return ECS.instance.scm.onSystemAdded;
    }

    static get onSystemRemoved():Signal{
        return ECS.instance.scm.onSystemRemoved;
    }

    static get onEntityAddedToSystem():Signal{
        return ECS.instance.scm.onEntityAddedToSystem;
    }

    static get onEntityRemovedFromSystem():Signal{
        return ECS.instance.scm.onEntityRemovedFromSystem;
    }
}