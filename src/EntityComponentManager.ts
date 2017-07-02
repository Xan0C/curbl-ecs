import {ComponentBitmaskMap, IComponent} from "./Component";
import {DynamicObjectPool} from "./ObjectPool";
import {IEntity} from "./Entity";
import {UUIDGenerator} from "./UUIDGenerator";

export interface IEntityComponentManager {
    readonly pool:DynamicObjectPool;
    uuid:()=>string;
    addEntity(entity:IEntity,components?:{[x:string]:IComponent}):void;
    removeEntity(entity:IEntity,destroy?:boolean):boolean;
    addComponent(entity:IEntity,component:IComponent):void;
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T},destroy?:boolean):boolean;
    getComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):T;
    hasComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T}):boolean;
    getMask(entity:IEntity):number;
}

export class EntityComponentManager implements IEntityComponentManager {
    private _pool:DynamicObjectPool;
    private _uuid:()=>string;
    private componentBitmask:ComponentBitmaskMap;
    private entities:Map<string,IEntity>;
    private entityComponentMap: WeakMap<IEntity,{[x:string]:IComponent}>;
    private componentMask:WeakMap<IEntity,number>;

    constructor(componentBitmaskMap:ComponentBitmaskMap,uuid:()=>string=UUIDGenerator.uuid){
        this._pool = new DynamicObjectPool();
        this._uuid = uuid;
        this.componentBitmask = componentBitmaskMap;
        this.entities = new Map<string,IEntity>();
        this.entityComponentMap = new WeakMap<IEntity,{[x:string]:IComponent}>();
        this.componentMask = new WeakMap<IEntity,number>();
    }

    /**
     * @param entity
     * @param components
     */
    addEntity(entity:IEntity,components?:{[x:string]:IComponent}):void{
        this.entities.set(entity.id,entity);
        this.entityComponentMap.set(entity,components||Object.create(null));
        this.componentMask.set(entity,0);
        for(let key in this.entityComponentMap.get(entity)){
            this.componentMask.set(entity,this.componentMask.get(entity)|this.componentBitmask.get(this.entityComponentMap.get(entity)[key].constructor.name));
        }
    }

    /**
     *
     * @param entity
     * @param destroy
     * @returns {boolean}
     */
    removeEntity(entity:IEntity,destroy?:boolean):boolean{
        if(this.entityComponentMap.has(entity)){
            //TODO: Find a better way to pool the components of an entity
            for(let key in this.entityComponentMap.get(entity)){
                let component = this.entityComponentMap.get(entity)[key];
                this.removeComponent(entity,component.constructor as any,destroy);
            }
            if(!destroy) {
                this._pool.push(entity);
            }
        }
        this.componentMask.delete(entity);
        this.entityComponentMap.delete(entity);
        return this.entities.delete(entity.id);
    }

    /**
     * @param entity
     * @param component
     */
    addComponent(entity:IEntity,component:IComponent):void{
        if(this.entityComponentMap.has(entity)) {
            this.entityComponentMap.get(entity)[component.constructor.name] = component;
            this.componentMask.set(entity,this.componentMask.get(entity) | this.componentBitmask.get(component.constructor.name));
        }
    }

    /**
     * @param entity
     * @param component
     * @param destroy
     * @returns {boolean}
     */
    removeComponent<T extends IComponent>(entity:IEntity,component:{new(...args):T},destroy:boolean=false):boolean{
        if(this.entityComponentMap.has(entity)) {
            let comp = this.entityComponentMap.get(entity)[component.prototype.constructor.name];
            if(comp){
                if(!destroy) {
                    this._pool.push(comp);
                }
                this.componentMask.set(entity,this.componentMask.get(entity) ^ this.componentBitmask.get(component));
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

    public get uuid():() => string {
        return this._uuid;
    }

    public set uuid(value:() => string) {
        this._uuid = value;
    }
}