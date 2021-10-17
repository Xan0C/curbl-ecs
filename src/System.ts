import { Entity, EntityProp } from './Entity';
import { ECS } from './ECS';
import EventEmitter from 'eventemitter3';
import { addNoopMethodsToPrototype, inject } from './Injector';

export const SYSTEM_PROPERTIES = {
    entityMap: () => {
        return Object.create(null);
    },
    entities: () => {
        return [];
    },
    events: () => {
        return new EventEmitter();
    },
};

export class System {
    id?: string;
    bitmask?: number;

    readonly entityMap: { [id: string]: number };
    readonly entities: Entity[];
    readonly events: EventEmitter;

    constructor() {
        this.entityMap = SYSTEM_PROPERTIES.entityMap();
        this.entities = SYSTEM_PROPERTIES.entities();
        this.events = SYSTEM_PROPERTIES.events();
    }

    setUp() {}
    tearDown() {}

    has(entity: EntityProp): boolean {
        return !!this.entities[this.entityMap[entity.id]];
    }

    remove(entity: Entity, fromECS = true): void {
        if (fromECS) {
            ECS.removeEntity(entity);
        }
        ECS.removeEntityFromSystem(entity, this);
    }

    dispose() {
        ECS.removeSystem(this);
    }
}

export const SYSTEM_PROTOTYPE = {
    setUp: () => {
        return ECS.noop;
    },
    tearDown: () => {
        return ECS.noop;
    },
    has: () => {
        return System.prototype.has;
    },
    remove: () => {
        return System.prototype.remove;
    },
    dispose: () => {
        return System.prototype.dispose;
    },
};

export const SYSTEM_PROPERTY_DECORATOR = {};

export function injectSystem<T extends object>(system: T, updateMethods: string[]): System & T {
    const injectedSystem = inject<T & System>(system, SYSTEM_PROPERTIES, SYSTEM_PROTOTYPE, SYSTEM_PROPERTY_DECORATOR);
    addNoopMethodsToPrototype(system, updateMethods);
    return injectedSystem;
}
