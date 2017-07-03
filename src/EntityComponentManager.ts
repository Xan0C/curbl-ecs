import {ComponentBitmaskMap, IComponent} from "./Component";
import {DynamicObjectPool} from "./ObjectPool";
import {IEntity} from "./Entity";
import {UUIDGenerator} from "./UUIDGenerator";
import {Signal} from "./Signal";

export interface IEntityComponentManager {
    readonly pool:DynamicObjectPool;
    readonly onEntityAdded:Signal;
    readonly onEntityRemoved:Signal;
    readonly onComponentAdded:Signal;
    readonly onComponentRemoved:Signal;
    readonly entities:Map<string,IEntity>;
    uuid:()=>string;
    addEntity(entity:IEntity,components?:{[x:string]:IComponent},silent?:boolean):void;
    removeEntity(entity:IEntity,destroy?:boolean,silent?:boolean):boolean;
    addComponent(entity:IEntity,component:IComponent,silent?:boolean):void;
    hasEntity(entity:IEntity):boolean;
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T},destroy?:boolean,silent?:boolean):boolean;
    getComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):T;
    hasComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):boolean;
    getMask(entity:IEntity):number;
}

export class EntityComponentManager implements IEntityComponentManager {
    private _pool:DynamicObjectPool;
    private _onEntityAdded:Signal;
    private _onEntityRemoved:Signal;
    private _onComponentAdded:Signal;
    private _onComponentRemoved:Signal;
    private _uuid:()=>string;
    private componentBitmask:ComponentBitmaskMap;
    private _entities:Map<string,IEntity>;
    private entityComponentMap: WeakMap<IEntity,{[x:string]:IComponent}>;
    private componentMask:WeakMap<IEntity,number>;

    constructor(componentBitmaskMap:ComponentBitmaskMap,uuid:()=>string=UUIDGenerator.uuid){
        this._pool = new DynamicObjectPool();
        this._onEntityAdded = new Signal();
        this._onEntityRemoved = new Signal();
        this._onComponentAdded = new Signal();
        this._onComponentRemoved = new Signal();
        this._uuid = uuid;
        this.componentBitmask = componentBitmaskMap;
        this._entities = new Map<string,IEntity>();
        this.entityComponentMap = new WeakMap<IEntity,{[x:string]:IComponent}>();
        this.componentMask = new WeakMap<IEntity,number>();
    }

    /**
     * @param entity
     * @param components
     */
    addEntity(entity:IEntity,components?:{[x:string]:IComponent},silent:boolean=false):void{
        this._entities.set(entity.id,entity);
        this.entityComponentMap.set(entity,components||Object.create(null));
        this.componentMask.set(entity,0);
        for(let key in this.entityComponentMap.get(entity)){
            this.componentMask.set(entity,this.componentMask.get(entity)|this.componentBitmask.get(this.entityComponentMap.get(entity)[key].constructor.name));
        }
        if(!silent) {
            this._onEntityAdded.dispatch(entity);
        }
    }

    /**
     *
     * @param entity
     * @param destroy
     * @param silent
     * @returns {boolean}
     */
    removeEntity(entity:IEntity,destroy?:boolean,silent:boolean=false):boolean{
        if(this.entityComponentMap.has(entity)){
            //TODO: Find a better way to pool the components of an entity
            for(let key in this.entityComponentMap.get(entity)){
                let component = this.entityComponentMap.get(entity)[key];
                this.removeComponent(entity,component.constructor as any,destroy,true);
            }
            if(!destroy) {
                this._pool.push(entity);
            }
            this.componentMask.delete(entity);
            this.entityComponentMap.delete(entity);
            if(!silent) {
                this._onEntityRemoved.dispatch(entity);
            }
            return this._entities.delete(entity.id);
        }
        return false;
    }

    hasEntity(entity:IEntity):boolean{
        return this._entities.has(entity.id);
    }

    /**
     * @param entity
     * @param component
     * @param silent
     */
    addComponent(entity:IEntity,component:IComponent,silent:boolean=false):void{
        if(this.entityComponentMap.has(entity)) {
            this.entityComponentMap.get(entity)[component.constructor.name] = component;
            this.componentMask.set(entity,this.componentMask.get(entity) | this.componentBitmask.get(component.constructor.name));
            if(!silent) {
                this._onComponentAdded.dispatch(entity, component);
            }
        }
    }

    /**
     * @param entity
     * @param component
     * @param destroy
     * @param silent
     * @returns {boolean}
     */
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T},destroy:boolean=false,silent:boolean=false):boolean{
        if(this.entityComponentMap.has(entity)) {
            let comp = this.entityComponentMap.get(entity)[component.prototype.constructor.name];
            if(comp){
                if(!destroy) {
                    this._pool.push(comp);
                }
                this.componentMask.set(entity,this.componentMask.get(entity) ^ this.componentBitmask.get(component));
                if(!silent) {
                    this._onComponentRemoved.dispatch(entity, comp);
                }
                return delete this.entityComponentMap.get(entity)[component.prototype.constructor.name];
            }
        }
        return false;
    }

    /**
     *
     * @param entity
     * @param component
     * @returns {any}
     */
    getComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):T{
        if(this.entityComponentMap.has(entity)) {
            return this.entityComponentMap.get(entity)[component.prototype.constructor.name] as T;
        }
        return undefined;
    }

    /**
     *
     * @param entity
     * @param component
     * @returns {boolean}
     */
    hasComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):boolean{
        if(this.entityComponentMap.has(entity)){
            return !!this.entityComponentMap.get(entity)[component.prototype.constructor.name];
        }
        return false;
    }

    /**
     * Return the bitmask for the entity
     * @param entity
     * @returns {number}
     */
    getMask(entity:IEntity):number{
        return this.componentMask.get(entity)||0;
    }

    public get pool():DynamicObjectPool {
        return this._pool;
    }

    public get entities():Map<string, IEntity> {
        return this._entities;
    }

    public get uuid():() => string {
        return this._uuid;
    }

    public set uuid(value:() => string) {
        this._uuid = value;
    }

    public get onEntityAdded():Signal {
        return this._onEntityAdded;
    }

    public get onEntityRemoved():Signal {
        return this._onEntityRemoved;
    }

    public get onComponentAdded():Signal {
        return this._onComponentAdded;
    }

    public get onComponentRemoved():Signal {
        return this._onComponentRemoved;
    }
}