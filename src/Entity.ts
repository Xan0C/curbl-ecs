import { IComponent } from './Component';
import { ECS } from './ECS';

export type ComponentMap =  {[component: string]: IComponent};

export type EntityProp = {
    id?: string;
    components?: ComponentMap;
    bitmask?: number;
};

export interface EntityDecoratorComponent {
    component: { new(config?: {[x: string]: any}): any };
    config?: { [x: string]: any };
}

export interface IEntity extends EntityProp {
    get?<T extends IComponent>(comp: {new(...args): T}|string): T;
    getAll?(): {[id: string]: IComponent};
    has?<T extends IComponent>(comp: {new(...args): T}|string): boolean;
    add?(component: IComponent): void;
    remove?<T extends IComponent>(component: {new(...args): T}|string): boolean;
    dispose?(): IEntity;
}

const ENTITY_PROPERTIES = {
    id:()=>{return ECS.uuid();},
    components:function () {return this.components || Object.create(null);},
    bitmask:()=>{return 0;}
};

export class Entity implements IEntity {

    readonly id: string;
    readonly components: {[id: string]: IComponent};
    readonly bitmask: number;

    constructor(uuid?: string){
        this.id = uuid || ENTITY_PROPERTIES.id();
        this.components = ENTITY_PROPERTIES.components();
        this.bitmask = ENTITY_PROPERTIES.bitmask();
    }

    getAll(): {[id: string]: IComponent}{
        return this.components;
    }

    get<T extends IComponent>(component: { new(...args): T }|string): T {
        if(typeof component === 'string') {
            return this.components[component] as T;
        }
        return this.components[component.prototype.constructor.name] as T;
    }

    has<T extends IComponent>(component: { new(...args): T }|string): boolean {
        if(typeof component === 'string'){
            return !!this.components[component];
        }
        return !!this.components[component.prototype.constructor.name];
    }

    add(component: IComponent): void{
        return ECS.addComponent(this,component);
    }

    remove<T extends IComponent>(component: {new(...args): T}|string): boolean{
        return ECS.removeComponent(this,component);
    }

    dispose(): IEntity{
        return ECS.removeEntity(this)
    }
}

const ENTITY_PROTOTYPE = {
    get:()=>{return Entity.prototype.get;},
    getAll:()=>{return Entity.prototype.getAll;},
    has:()=>{return Entity.prototype.has;},
    add:()=>{return Entity.prototype.add;},
    remove:()=>{return Entity.prototype.remove;},
    dispose:()=>{return Entity.prototype.dispose;},
};

export const ENTITY_PROPERTY_DECORATOR = {

};

export function injectEntity(entity: IEntity){
    for(let propKey in ENTITY_PROPERTIES){
        if(entity[propKey] === undefined || entity[propKey] === null){
            entity[propKey] = ENTITY_PROPERTIES[propKey]();
        }
    }
    for(let propKey in ENTITY_PROPERTY_DECORATOR){
        if(entity[propKey] === undefined || entity[propKey] === null){
            ENTITY_PROPERTY_DECORATOR[propKey](entity);
        }
    }
    for(let protoKey in ENTITY_PROTOTYPE){
        if(entity.constructor && entity.constructor.prototype){
            if(entity.constructor.prototype[protoKey] === undefined || entity.constructor.prototype[protoKey] === null){
                entity.constructor.prototype[protoKey] = ENTITY_PROTOTYPE[protoKey]();
            }
        }else{
            if(entity[protoKey] === undefined || entity[protoKey] === null){
                entity[protoKey] = ENTITY_PROTOTYPE[protoKey]();
            }
        }
    }
}