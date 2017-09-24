import {Entity, EntityDecoratorComponent, IEntity, injectEntity} from "./Entity";
import {EntityComponentManager, IEntityComponentManager} from "./EntityComponentManager";
import {ComponentBitmaskMap, IComponent, injectComponent} from "./Component";
import {injectSystem, ISystem} from "./System";
import {EntitySystemManager, IEntitySystemManager} from "./EntitySystemManager";
import {Signal} from "./Signal";
import {PropertyDescriptorBinder} from "./PropertyDescriptorBinder";

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

    /**
     * Binds to signals to the PropertyAccessor
     * onPropertySet called each time the property is changed and dispatches the object and propertyKey
     * onPropertyGet called each time the property is accessed and dispatched the object,propertyKey and value
     * @param object
     * @param propertyKey
     * @returns {{onPropertySet: Signal, onPropertyGet: Signal}}
     */
    static bind(object:any,propertyKey:string):{onPropertyGet:Signal,onPropertySet:Signal}{
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
        injectEntity(entity);
        return ECS.instance.ecm.addEntity(entity,components);
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

    static addSystem<T extends ISystem>(system:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>):T{
        return ECS.instance.scm.add(system,componentMask);
    }

    static addSubsystem<T extends ISystem>(system:ISystem,subsystem:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>):T{
        return ECS.instance.scm.addSubsystem(system,subsystem,componentMask);
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

    static getSubsystems(system:ISystem):Map<string,ISystem>{
        return ECS.instance.scm.getSubsystems(system);
    }

    static getSubsystemsOf<T extends ISystem>(constructor:{new(config?:{[x:string]:any}):T}):Map<string,ISystem>{
        return ECS.instance.scm.getSubsystemsOf(constructor);
    }

    static update():void{
        ECS.instance.scm.update();
    }

    static callSystemMethod(func:string):void{
        ECS.instance.scm.callSystemMethod(func);
    }

    private static createComponentsFromDecorator(components:EntityDecoratorComponent[]):{[x:string]:IComponent}{
        let comps = Object.create(null);
        for(let dec of components){
            comps[dec.component.prototype.constructor.name] = new dec.component(dec.config);
        }
        return comps;
    }

    static Component():(constructor:{ new(config?:{[x:string]:any}):IComponent }) => any{
        return function(constructor:{new(...args):IComponent}){
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorSystem:any = function(...args){
                let component = ECS.instance.ecm.pool.pop(constructor);
                if(!component) {
                    component = wrapper.apply(this, args);
                    Object.setPrototypeOf(component, Object.getPrototypeOf(this));
                    injectComponent(component);
                }else{
                    component.init(...args);
                }
                return component;
            };
            DecoratorSystem.prototype = constructor.prototype;
            return DecoratorSystem;
        }
    }

    static System(...components:{new(config?:{[x:string]:any}):any}[]):(constructor:{ new(config?:{[x:string]:any}):ISystem }) => any{
        return function(constructor:{new(...args):ISystem}){
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorSystem:any = function(...args){
                let system = wrapper.apply(this,args);
                Object.setPrototypeOf(system,Object.getPrototypeOf(this));
                injectSystem(system,ECS.instance.scm.systemUpdateMethods);
                ECS.instance.scm.create(system,components);
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
            var wrapper = function (...args) { return new (constructor.bind.apply(constructor, [void 0].concat(args)))(); };
            let DecoratorEntity:any = function(...args){
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

    private static decoratorEntityProperty(components:EntityDecoratorComponent[]):(target:Object, propKey:number | string) => void{
        return function(target:Object,propKey:number|string){
            let entity = ECS.instance.ecm.pool.pop(Entity);
            if(!entity){
                entity = new Entity();
                injectEntity(entity);
            }
            ECS.instance.ecm.createEntity(entity,ECS.createComponentsFromDecorator(components));
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

    static get systemUpdateMethods():Array<string>{
        return ECS.instance.scm.systemUpdateMethods;
    }

    static set systemUpdateMethods(value:Array<string>){
        ECS.instance.scm.systemUpdateMethods = value;
    }
}