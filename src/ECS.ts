import { EntityHandle } from './EntityHandle';
import {Component} from './Component';
import {System} from './System';
import {Injector} from './Injector';
import * as EventEmitter from 'eventemitter3';
import {EntityComponentWorker} from "./EntityComponentWorker";
import {EntityComponentSystem} from "./EntityComponentSystem";
import {ECSBase} from "./ECSBase";
import { Entity, EntityDecoratorComponent } from './Entity';

export class ECS {
    private static _instance: ECSBase;

    private constructor(){}

    private static get instance(): ECSBase{
        if(ECS._instance){
            return ECS._instance;
        }
        //@ts-ignore
        if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
            return ECS._instance = new EntityComponentWorker();
        } else {
            return ECS._instance = new EntityComponentSystem();
        }
    }

    static setPrototypeOf<T>(obj: T, proto): T {
        //@ts-ignore
        const fn = Object.setPrototypeOf || function(obj, proto) {
            obj.__proto__ = proto;
            return obj;
        };
        return fn(obj, proto);
    }

    static get Injector(): Injector{
        return Injector.instance;
    }

    static noop(){}

    /**
     * create an entity
     * @param entity {optional} - use existing entity
     * @param components {optional} - components to add to the entity if provided this will override the current components of the entity if any
     */
    static createEntity<T extends Entity>(entity?: T | Entity, components?: {[x: string]: Component}): T & EntityHandle {
        return ECS.instance.ecm.createEntity(entity,components);
    }

    /**
     * adds the Entity with the provided components(or existing ones) to the ECS
     * @param entity - Entity to add to the ECS
     * @param components - Components for the entity, if provided this will override the current components of the entity if any
     */
    static addEntity<T extends object>(entity: T, components?: {[x: string]: Component}): T & Entity {
        return ECS.instance.ecm.addEntity(entity,components);
    }

    /**
     * Return a list of entities with the specified components
     * since we need to check all entities this can be quite slow
     * @param components - list of components the entity needs to have
     */
    static getEntities<T extends Entity>(...components: { new(config?: { [p: string]: any }): any }[]): T[] {
        return ECS.instance.ecm.getEntities(...components);
    }

    /**
     * removes the entity from the ECS, it will keep all of its components
     * @param entity - Entity to remove
     * @returns {Entity}
     */
    static removeEntity<T extends Entity>(entity: T): T {
        return ECS.instance.ecm.removeEntity(entity);
    }

    /**
     * removes all entities from the ecs
     */
    static removeAllEntities(): Entity[] {
        return ECS.instance.ecm.removeAllEntities();
    }

    static hasEntity(entity: Entity): boolean{
        return ECS.instance.ecm.hasEntity(entity);
    }

    static removeComponent<T extends Component>(entity: Entity, component: {new(...args): T}|string): boolean{
        return ECS.instance.ecm.removeComponent(entity,component);
    }

    static addComponent(entity: Entity, component: Component): void{
        return ECS.instance.ecm.addComponent(entity,component);
    }

    static addSystem<T extends System>(system: T, componentMask?: {new(config?: {[x: string]: any}): any}[]): T{
        return ECS.instance.scm.add(system,componentMask);
    }

    static hasSystem(system: System): boolean{
        return ECS.instance.scm.has(system);
    }

    static hasSystemOf<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): boolean{
        return ECS.instance.scm.hasOf(constructor);
    }

    static removeSystem(system: System): boolean{
        return ECS.instance.scm.remove(system);
    }

    static removeSystemOf<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): boolean{
        return ECS.instance.scm.removeOf(constructor);
    }

    static getSystemComponentMaskOf<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): number{
        return ECS.instance.scm.getComponentMaskOf(constructor);
    }

    static removeEntityFromSystem(entity: Entity, system?: System): void{
        ECS.instance.scm.removeEntity(entity,system);
    }

    static getSystem<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): T{
        return ECS.instance.scm.get(constructor);
    }

    static update(a1?: any,a2?: any,a3?: any,a4?: any,a5?: any,a6?: any,a7?: any,a8?: any,a9?: any): void {
        ECS.instance.update(a1,a2,a3,a4,a5,a6,a7,a8,a9);
    }

    /**
     * Calls a specific method for all systems (e.g. update)
     * @param functionName - name of the function to be called
     */
    static callSystemMethod(functionName: string): void{
        ECS.instance.scm.callSystemMethod(functionName);
    }

    static addWorker(worker: Worker): void {
        ECS.instance.addWorker(worker);
    }

    static init(cb: () => void): void {
        ECS.instance.init(cb);
    }

    private static createComponentsFromDecorator(components: EntityDecoratorComponent[]): {[x: string]: Component}{
        const comps = Object.create(null);
        for(const dec of components){
            const component = new dec.component(dec.config);
            comps[component.id] = component;
        }
        return comps;
    }

    static Component<T extends object>(id?: string): (constructor: { new(...args): T }) => any {
        const getter = id ? function() {
            return this._id || (this._id = id);
        } : function() {
            return this._id || (this._id = this.constructor.name);
        };

        const setter = function(id: string) {
            this._id = id;
        };

        return function(constructor: { new(...args): Component }) {
            Object.defineProperty(constructor.prototype, "id", {
                get: getter,
                set: setter
            });
            return constructor;
        }
    }

    static System(...components: {new(...args): object | Component}[]): (constructor: { new(...args): System }) => any{
        return function(constructor: {new(...args): System}){
            Object.defineProperty(constructor.prototype, "id", {
                get: function() {
                    return this._id || (this._id = this.constructor.name);
                }
            });
            Object.defineProperty(constructor.prototype, "bitmask", {
                get: function() {
                    return this._bitmask || (this._bitmask = ECS.instance.componentBitmaskMap.getCompound(components));
                },
                set: function(bitmask: number) {
                    this._bitmask = bitmask;
                }
            });
            return constructor;
        }
    }

    static Entity<T extends object>(...components: EntityDecoratorComponent[]): ((constructor: { new(...args): T }) => any)  {
        return function(constructor: {new(...args): T}){
            Object.defineProperty(constructor.prototype, "components", {
                get: function() {
                    return this._components || (this._components = ECS.createComponentsFromDecorator(components));
                },
                set: function(components) {
                    this._components = components;
                }
            });
            return constructor;
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