import { Component } from './Component';
import { ECS } from './ECS';
import { Injector } from './Injector';

export interface ComponentMap {[component: string]: Component}

export interface EntityProp {
    id?: string;
    components?: ComponentMap;
    bitmask?: number;
}

export interface EntityDecoratorComponent {
    component: { new(config?: {[x: string]: any}): any };
    config?: { [x: string]: any };
}

export interface Entity extends EntityProp {
    get?<T extends Component>(comp: {new(...args): T}|string): T;
    getAll?(): {[id: string]: Component};
    has?<T extends Component>(comp: {new(...args): T}|string): boolean;
    add?(component: Component): void;
    remove?<T extends Component>(component: {new(...args): T}|string): boolean;
    dispose?(): Entity;
}

const ENTITY_PROPERTIES = {
    id:()=>{return ECS.uuid();},
    components:function () {return this.components || Object.create(null);},
    bitmask:()=>{return 0;}
};

export class EntityHandle implements Entity {

    readonly id: string;
    readonly components: {[id: string]: Component};
    readonly bitmask: number;

    constructor(uuid?: string){
        this.id = uuid || ENTITY_PROPERTIES.id();
        this.components = ENTITY_PROPERTIES.components();
        this.bitmask = ENTITY_PROPERTIES.bitmask();
    }

    getAll(): {[id: string]: Component}{
        return this.components;
    }

    get<T extends Component>(component: { new(...args): T }|string): T {
        if(typeof component === 'string') {
            return this.components[component] as T;
        }
        return this.components[component.prototype.constructor.name] as T;
    }

    has<T extends Component>(component: { new(...args): T }|string): boolean {
        if(typeof component === 'string'){
            return !!this.components[component];
        }
        return !!this.components[component.prototype.constructor.name];
    }

    add(component: Component): void{
        return ECS.addComponent(this,component);
    }

    remove<T extends Component>(component: {new(...args): T}|string): boolean{
        return ECS.removeComponent(this,component);
    }

    dispose(): this {
        return ECS.removeEntity(this);
    }
}

const ENTITY_PROTOTYPE = {
    get:()=>{return EntityHandle.prototype.get;},
    getAll:()=>{return EntityHandle.prototype.getAll;},
    has:()=>{return EntityHandle.prototype.has;},
    add:()=>{return EntityHandle.prototype.add;},
    remove:()=>{return EntityHandle.prototype.remove;},
    dispose:()=>{return EntityHandle.prototype.dispose;},
};

export const ENTITY_PROPERTY_DECORATOR = {

};

export function injectEntity(entity: Entity){
    Injector.inject(entity, ENTITY_PROPERTIES, ENTITY_PROTOTYPE, ENTITY_PROPERTY_DECORATOR);
}