import {EntityDecoratorComponent, IEntity, injectEntity} from "./Entity";
import {EntityComponentManager, IEntityComponentManager} from "./EntityComponentManager";
import {ComponentBitmaskMap, IComponent, injectComponent} from "./Component";
import {injectSystem, ISystem} from "./System";
import {EntitySystemManager, IEntitySystemManager} from "./EntitySystemManager";
import {InjectorService} from "./InjectorService";
import * as EventEmitter from "eventemitter3";
import {ECM_EVENTS, ESM_EVENTS} from "./Events";

export class ECS {
    private static _instance: ECS;
    private events: EventEmitter;
    private ecm: IEntityComponentManager;
    private scm: IEntitySystemManager;
    private componentBitmaskMap: ComponentBitmaskMap;

    private constructor(){
        this.componentBitmaskMap = new ComponentBitmaskMap();
        this.events = new EventEmitter();
        this.ecm = new EntityComponentManager(this.componentBitmaskMap, this.events);
        this.scm = new EntitySystemManager(this.componentBitmaskMap, this.events);
        this.registerEvents();
    }

    private registerEvents(){
        this.ecm.events.on(ECM_EVENTS.ENTITY_ADDED,this.onEntityAdded);
        this.ecm.events.on(ECM_EVENTS.ENTITY_REMOVED,this.onEntityRemoved);
        this.ecm.events.on(ECM_EVENTS.COMPONENT_ADDED,this.onComponentAdded);
        this.ecm.events.on(ECM_EVENTS.COMPONENT_REMOVED,this.onComponentRemoved);
        this.scm.events.on(ESM_EVENTS.SYSTEM_ADDED,this.onSystemAdded);
    }

    private onEntityAdded(entity: IEntity){
        ECS.instance.scm.updateEntity(entity);
    }

    private onEntityRemoved(entity: IEntity){
        ECS.instance.scm.removeEntity(entity);
    }

    private onComponentAdded(entity: IEntity){
        ECS.instance.scm.updateEntity(entity);
    }

    private onComponentRemoved(entity: IEntity){
        ECS.instance.scm.updateEntity(entity);
    }

    private onSystemAdded(system: ISystem){
        for(let id in ECS.instance.ecm.entities){
            ECS.instance.scm.updateEntity(ECS.instance.ecm.entities[id],system);
        }
    }

    private static get instance(): ECS{
        if(ECS._instance){
            return ECS._instance;
        }
        return ECS._instance = new ECS();
    }

    static setPrototypeOf<T>(obj: T, proto): T {
        //@ts-ignore
        const fn = Object.setPrototypeOf || function(obj, proto) {
            obj.__proto__ = proto;
            return obj;
        };
        return fn(obj, proto);
    }

    static get Injector(): InjectorService{
        return InjectorService.instance;
    }

    static noop(){}

    /**
     * create an entity
     * @param entity {optional} - use existing entity
     * @param components {optional} - components to add to the entity if provided this will override the current components of the entity if any
     */
    static createEntity(entity?: IEntity,components?: {[x: string]: IComponent}): IEntity{
        return ECS.instance.ecm.createEntity(entity,components);
    }

    /**
     * adds the Entity with the provided components(or existing ones) to the ECS
     * @param entity - Entity to add to the ECS
     * @param components - Components for the entity, if provided this will override the current components of the entity if any
     */
    static addEntity<T extends IEntity>(entity: T,components?: {[x: string]: IComponent}): T{
        return ECS.instance.ecm.addEntity(entity,components);
    }

    /**
     * Return a list of entities with the specified components
     * since we need to check all entities this can be quite slow
     * @param components - list of components the entity needs to have
     */
    static getEntities(...components: { new(config?: { [p: string]: any }): any }[]): IEntity[] {
        return ECS.instance.ecm.getEntities(...components);
    }

    /**
     * removes the entity from the ECS, it will keep all of its components
     * @param entity - Entity to remove
     * @returns {IEntity}
     */
    static removeEntity(entity: IEntity): IEntity {
        return ECS.instance.ecm.removeEntity(entity);
    }

    /**
     * removes all entities from the ecs
     */
    static removeAllEntities(): IEntity[] {
        return ECS.instance.ecm.removeAllEntities();
    }

    static hasEntity(entity: IEntity): boolean{
        return ECS.instance.ecm.hasEntity(entity);
    }

    static removeComponent<T extends IComponent>(entity: IEntity,component: {new(...args): T}|string): boolean{
        return ECS.instance.ecm.removeComponent(entity,component);
    }

    static addComponent(entity: IEntity,component: IComponent): void{
        return ECS.instance.ecm.addComponent(entity,component);
    }

    static addSystem<T extends ISystem>(system: T,componentMask?: {new(config?: {[x: string]: any}): any}[]): T{
        return ECS.instance.scm.add(system,componentMask);
    }

    static hasSystem(system: ISystem): boolean{
        return ECS.instance.scm.has(system);
    }

    static hasSystemOf<T extends ISystem>(constructor: {new(config?: {[x: string]: any}): T}): boolean{
        return ECS.instance.scm.hasOf(constructor);
    }

    static removeSystem(system: ISystem): boolean{
        return ECS.instance.scm.remove(system);
    }

    static removeSystemOf<T extends ISystem>(constructor: {new(config?: {[x: string]: any}): T}): boolean{
        return ECS.instance.scm.removeOf(constructor);
    }

    static getSystemComponentMaskOf<T extends ISystem>(constructor: {new(config?: {[x: string]: any}): T}): number{
        return ECS.instance.scm.getComponentMaskOf(constructor);
    }

    static removeEntityFromSystem(entity: IEntity,system?: ISystem): void{
        ECS.instance.scm.removeEntity(entity,system);
    }

    static getSystem<T extends ISystem>(constructor: {new(config?: {[x: string]: any}): T}): T{
        return ECS.instance.scm.get(constructor);
    }

    static update(a1?: any,a2?: any,a3?: any,a4?: any,a5?: any,a6?: any,a7?: any,a8?: any,a9?: any): void{
        ECS.instance.scm.update(a1,a2,a3,a4,a5,a6,a7,a8,a9);
    }

    /**
     * Calls a specific method for all systems (e.g. update)
     * @param functionName - name of the function to be called
     */
    static callSystemMethod(functionName: string): void{
        ECS.instance.scm.callSystemMethod(functionName);
    }

    private static createComponentsFromDecorator(components: EntityDecoratorComponent[]): {[x: string]: IComponent}{
        const comps = Object.create(null);
        let component;
        for(let dec of components){
            component = new dec.component(dec.config);
            comps[component.id] = component;
        }
        return comps;
    }

    static Component(id?: string): (constructor: { new(config?: {[x: string]: any}): IComponent }) => any{
        return function(constructor: {new(...args): IComponent}){
            const DecoratorComponent: any = function(...args){
                const component = new constructor(...args);
                ECS.setPrototypeOf(component, Object.getPrototypeOf(this));
                injectComponent(component);
                component.id = id||constructor.prototype.constructor.name;
                return component;
            };
            DecoratorComponent.prototype = constructor.prototype;
            return DecoratorComponent;
        }
    }

    static System(...components: {new(config?: {[x: string]: any}): IComponent}[]): (constructor: { new(config?: {[x: string]: any}): ISystem }) => any{
        return function(constructor: {new(...args): ISystem}){
            const DecoratorSystem: any = function(...args) {
                const system = new constructor(...args);
                ECS.setPrototypeOf(system,Object.getPrototypeOf(this));
                injectSystem(system,ECS.instance.scm.systemUpdateMethods);
                system.id = system.id||constructor.prototype.constructor.name;
                ECS.instance.scm.updateBitmask(system,components);
                return system;
            };
            DecoratorSystem.prototype = constructor.prototype;
            return DecoratorSystem;
        }
    }

    static Entity(...components: EntityDecoratorComponent[]): ((constructor: { new(config?: {[x: string]: any}): IEntity }) => any)&((target: Record<string, any>, propKey: number | string) => void)  {
        return function(constructor: {new(...args): IEntity}){
            const DecoratorEntity: any = function(...args){
                const entity = new constructor(...args);
                ECS.setPrototypeOf(entity,Object.getPrototypeOf(this));
                injectEntity(entity);
                ECS.instance.ecm.createEntity(entity,ECS.createComponentsFromDecorator(components));
                return entity;
            };
            DecoratorEntity.prototype = constructor.prototype;
            return DecoratorEntity;
        }
    }

    static get uuid(): () => string{
        return ECS.instance.ecm.uuid;
    }

    static set uuid(value: () => string){
        ECS.instance.ecm.uuid = value;
    }

    static get systemUpdateMethods(): string[]{
        return ECS.instance.scm.systemUpdateMethods;
    }

    static set systemUpdateMethods(methods: string[]){
        ECS.instance.scm.systemUpdateMethods = methods;
    }

    static get events(): EventEmitter {
        return ECS.instance.events;
    }
}