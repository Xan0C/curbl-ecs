import {Entity} from "./EntityHandle";
import {ECS} from "./ECS";
import * as EventEmitter from "eventemitter3";
import { Injector } from './Injector';

export const SYSTEM_PROPERTIES = {
    entityMap:()=>{return Object.create(null);},
    entities:()=>{return [];},
    events:()=>{return new EventEmitter();}
};

export class System {
    id?: string; //TODO only needed by typescript its replaced by the system injection via @ECS.System decorator
    bitmask?: number; //TODO only needed by typescript its replaced by the system injection via @ECS.System decorator

    readonly entityMap: {[id: string]: number};
    readonly entities: Entity[];
    readonly events: EventEmitter;

    constructor() {
        this.entityMap = SYSTEM_PROPERTIES.entityMap();
        this.entities = SYSTEM_PROPERTIES.entities();
        this.events = SYSTEM_PROPERTIES.events();
    }

    setUp() {}
    tearDown() {}

    has(entity: Entity): boolean {
        return !!this.entities[this.entityMap[entity.id]];
    }

    remove(entity: Entity, fromECS: boolean=true): void {
        if(fromECS) {
            ECS.removeEntity(entity);
        }
        ECS.removeEntityFromSystem(entity, this);
    }

    dispose() {
        ECS.removeSystem(this);
    }
}

export const SYSTEM_PROTOTYPE = {
    setUp:()=>{return ECS.noop;},
    tearDown:()=>{return ECS.noop;},
    has:()=>{return System.prototype.has;},
    remove:()=>{return System.prototype.remove;},
    dispose:()=>{return System.prototype.dispose}
};

export const SYSTEM_PROPERTY_DECORATOR = {

};

export function injectSystem<T>(system: T, updateMethods: string[]) {
    Injector.inject(system, SYSTEM_PROPERTIES, SYSTEM_PROTOTYPE, SYSTEM_PROPERTY_DECORATOR);
    Injector.addNoopMethodsToPrototype(system, updateMethods);
}