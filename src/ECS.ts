import {EntityDecoratorComponent, IEntity} from './Entity';
import {IComponent} from './Component';
import {ISystem} from './System';
import {Injector} from './Injector';
import * as EventEmitter from 'eventemitter3';
import {EntityComponentWorker} from "./EntityComponentWorker";
import {EntityComponentSystem} from "./EntityComponentSystem";
import {ECSBase} from "./ECSBase";

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

    private static createComponentsFromDecorator(components: EntityDecoratorComponent[]): {[x: string]: IComponent}{
        const comps = Object.create(null);
        let component;
        for(let dec of components){
            component = new dec.component(dec.config);
            comps[component.id] = component;
        }
        return comps;
    }

    static Component(id?: string): (constructor: { new(...args): IComponent }) => any {
        const getter = id ? function() {
            return this._id || (this._id = id);
        } : function() {
            return this._id || (this._id = this.constructor.name);
        };

        const setter = function(id: string) {
            this._id = id;
        };

        return function(constructor: { new(...args): IComponent }) {
            Object.defineProperty(constructor.prototype, "id", {
                get: getter,
                set: setter
            });
            return constructor;
        }
    }

    static System(...components: {new(...args): IComponent}[]): (constructor: { new(...args): ISystem }) => any{
        return function(constructor: {new(...args): ISystem}){
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

    static Entity(...components: EntityDecoratorComponent[]): ((constructor: { new(...args): IEntity }) => any)&((target: Record<string, any>, propKey: number | string) => void)  {
        return function(constructor: {new(...args): IEntity}){
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