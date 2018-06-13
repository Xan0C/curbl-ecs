import {EntityDecoratorComponent, IEntity, injectEntity} from "./Entity";
import {ECM_EVENTS, EntityComponentManager, IEntityComponentManager} from "./EntityComponentManager";
import {ComponentBitmaskMap, IComponent, injectComponent} from "./Component";
import {injectSystem, ISystem} from "./System";
import {EntitySystemManager, ESM_EVENTS, IEntitySystemManager} from "./EntitySystemManager";
import {PropertyDescriptorBinder} from "./PropertyDescriptorBinder";
import {InjectorService} from "./InjectorService";
import * as EventEmitter from "eventemitter3";

/**
 * Created by Soeren on 29.06.2017.
 */
export class ECS {
    private static _instance:ECS;
    private ecm:IEntityComponentManager;
    private scm:IEntitySystemManager;
    private propertyDescriptorBinder:PropertyDescriptorBinder;
    private componentBitmaskMap:ComponentBitmaskMap;

    private constructor(){
        this.componentBitmaskMap = new ComponentBitmaskMap();
        this.ecm = new EntityComponentManager(this.componentBitmaskMap);
        this.scm = new EntitySystemManager(this.componentBitmaskMap);
        this.propertyDescriptorBinder = new PropertyDescriptorBinder();
        this.registerEvents();
    }

    private registerEvents(){
        this.ecm.events.on(ECM_EVENTS.ENTITY_ADDED,this.onEntityAdded);
        this.ecm.events.on(ECM_EVENTS.ENTITY_REMOVED,this.onEntityRemoved);
        this.ecm.events.on(ECM_EVENTS.COMPONENT_ADDED,this.onComponentAdded);
        this.ecm.events.on(ECM_EVENTS.COMPONENT_REMOVED,this.onComponentRemoved);

        this.scm.events.on(ESM_EVENTS.SYSTEM_ADDED,this.onSystemAdded);
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
        for(let id in ECS.instance.ecm.entities){
            ECS.instance.scm.updateEntity(ECS.instance.ecm.entities[id],system);
        }
    }

    private static get instance():ECS{
        if(ECS._instance){
            return ECS._instance;
        }
        return ECS._instance = new ECS();
    }

    public static get Injector():InjectorService{
        return InjectorService.instance;
    }

    /**
     * Binds to signals to the PropertyAccessor
     * returns an EventEmitter which listens for "get" and "set" events,
     * which are called each time "get" or "set" is called
     * @param object
     * @param propertyKey
     * @returns EventEmitter
     */
    static bind(object:any,propertyKey:string):EventEmitter{
        return ECS.instance.propertyDescriptorBinder.bind(object,propertyKey);
    }

    /**
     * Unbind the Binding to the property
     * @param object
     * @param propertyKey
     * @param restore - default:true restores the previous acessor when the property was binded
     * @returns {boolean}
     */
    static unbind(object:any,propertyKey?:string,restore?:boolean):boolean{
        return ECS.instance.propertyDescriptorBinder.unbind(object,propertyKey,restore);
    }

    static noop(){}

    static createEntity(entity?:IEntity,components?:{[x:string]:IComponent}):IEntity{
        return ECS.instance.ecm.createEntity(entity,components);
    }

    static addEntity<T extends IEntity>(entity:T,components?:{[x:string]:IComponent}):T{
        return ECS.instance.ecm.addEntity(entity,components);
    }

    static removeEntity(entity:IEntity,destroy?:boolean):boolean{
        return ECS.instance.ecm.removeEntity(entity,destroy);
    }

    static hasEntity(entity:IEntity):boolean{
        return ECS.instance.ecm.hasEntity(entity);
    }

    static removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}|string):boolean{
        return ECS.instance.ecm.removeComponent(entity,component);
    }

    static addComponent(entity:IEntity,component:IComponent):void{
        return ECS.instance.ecm.addComponent(entity,component);
    }

    static addSystem<T extends ISystem>(system:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>):T{
        return ECS.instance.scm.add(system,componentMask);
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

    static getSystemComponentMaskOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):number{
        return ECS.instance.scm.getComponentMaskOf(constructor);
    }

    static removeEntityFromSystem(entity:IEntity,system?:ISystem):void{
        ECS.instance.scm.removeEntity(entity,system);
    }

    static getSystem<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):T{
        return ECS.instance.scm.get(constructor);
    }

    static update():void{
        ECS.instance.scm.update();
    }

    static callSystemMethod(funcId:string):void{
        ECS.instance.scm.callSystemMethod(funcId);
    }

    private static createComponentsFromDecorator(components:EntityDecoratorComponent[]):{[x:string]:IComponent}{
        const comps = Object.create(null);
        let component;
        for(let dec of components){
            component = new dec.component(dec.config);
            comps[component.id] = component;
        }
        return comps;
    }

    static Component(id?:string):(constructor:{ new(config?:{[x:string]:any}):IComponent }) => any{
        return function(constructor:{new(...args):IComponent}){
            const wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            const DecoratorSystem:any = function(...args){
                let component = ECS.instance.ecm.pool.pop(constructor);
                if(!component) {
                    component = wrapper.apply(this, args);
                    Object.setPrototypeOf(component, Object.getPrototypeOf(this));
                    injectComponent(component);
                }else{
                    component.init(...args);
                }
                component.id = id||constructor.prototype.constructor.name;
                return component;
            };
            DecoratorSystem.prototype = constructor.prototype;
            return DecoratorSystem;
        }
    }

    static System(...components:{new(config?:{[x:string]:any}):IComponent}[]):(constructor:{ new(config?:{[x:string]:any}):ISystem }) => any{
        return function(constructor:{new(...args):ISystem}){
            const wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            const DecoratorSystem:any = function(...args){
                const system = wrapper.apply(this,args);
                Object.setPrototypeOf(system,Object.getPrototypeOf(this));
                injectSystem(system,ECS.instance.scm.systemUpdateMethods);
                system.id = system.id||constructor.prototype.constructor.name;
                ECS.instance.scm.updateBitmask(system,components);
                return system;
            };
            DecoratorSystem.prototype = constructor.prototype;
            return DecoratorSystem;
        }
    }

    static Entity(...components:EntityDecoratorComponent[]):((constructor:{ new(config?:{[x:string]:any}):IEntity }) => any)&((target:Object, propKey:number | string) => void)  {
        return function(constructor:{new(...args):IEntity}){
            const wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            const DecoratorEntity:any = function(...args){
                let entity = ECS.instance.ecm.pool.pop(constructor);
                if(!entity){
                    entity = wrapper.apply(this,args);
                    Object.setPrototypeOf(entity,Object.getPrototypeOf(this));
                    injectEntity(entity);
                }
                ECS.instance.ecm.createEntity(entity,ECS.createComponentsFromDecorator(components));
                return entity;
            };
            DecoratorEntity.prototype = constructor.prototype;
            return DecoratorEntity;
        }
    }

    static get uuid():()=>string{
        return ECS.instance.ecm.uuid;
    }

    static set uuid(value:()=>string){
        ECS.instance.ecm.uuid = value;
    }

    static get systemUpdateMethods():Array<string>{
        return ECS.instance.scm.systemUpdateMethods;
    }

    static set systemUpdateMethods(methods:Array<string>){
        ECS.instance.scm.systemUpdateMethods = methods;
    }
}