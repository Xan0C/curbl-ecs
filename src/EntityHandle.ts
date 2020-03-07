import { Component } from './Component';
import { ECS } from './ECS';
import { inject } from './Injector';
import { Entity } from './Entity';

export interface ComponentMap {
    [component: string]: Component;
}

const ENTITY_PROPERTIES = {
    id: () => {
        return ECS.uuid();
    },
    components: function() {
        return this._components || Object.create(null);
    },
    bitmask: () => {
        return 0;
    },
};

const ENTITY_PROPERTY_DECORATOR = {
    components: function(entity) {
        Object.defineProperty(entity, 'components', {
            get: function() {
                return this._components;
            },
            set: function(components) {
                this._components = components;
            },
        });
    },
};

export class EntityHandle implements Entity {
    readonly id: string;
    readonly components: { [id: string]: Component };
    readonly bitmask: number;

    constructor(uuid?: string) {
        this.id = uuid || ENTITY_PROPERTIES.id();
        this.components = ENTITY_PROPERTIES.components();
        this.bitmask = ENTITY_PROPERTIES.bitmask();
    }

    getAll(): { [id: string]: Component } {
        return this.components;
    }

    get<T extends object>(component: { new (...args): T } | string): T {
        if (typeof component === 'string') {
            return this.components[component] as T;
        }
        return this.components[component.prototype.constructor.name] as T;
    }

    has<T extends object>(component: { new (...args): T } | string): boolean {
        if (typeof component === 'string') {
            return !!this.components[component];
        }
        return !!this.components[component.prototype.constructor.name];
    }

    add<T extends object>(component: T): void {
        return ECS.addComponent(this, component);
    }

    remove<T extends object>(component: { new (...args): T } | string): boolean {
        return ECS.removeComponent(this, component);
    }

    dispose(): this {
        return ECS.removeEntity(this);
    }
}

const ENTITY_PROTOTYPE = {
    get: EntityHandle.prototype.get,
    getAll: EntityHandle.prototype.getAll,
    has: EntityHandle.prototype.has,
    add: EntityHandle.prototype.add,
    remove: EntityHandle.prototype.remove,
    dispose: EntityHandle.prototype.dispose,
};

export function injectEntity<T extends object>(entity: T): T & Entity {
    return inject(entity, ENTITY_PROPERTIES, ENTITY_PROTOTYPE, ENTITY_PROPERTY_DECORATOR);
}
