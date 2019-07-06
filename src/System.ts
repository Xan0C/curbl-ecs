import {IEntity} from "./Entity";
import {ECS} from "./ECS";
import * as EventEmitter from "eventemitter3";
import { Injector } from './Injector';

export interface ISystem {
    id?: string;
    bitmask?: number;
    readonly entityMap?: {[id: string]: number};
    readonly entities?: IEntity[];
    readonly events?: EventEmitter;
    setUp?(): void;
    tearDown?(): void;
    has?(entity: IEntity): boolean;
    remove?(entity: IEntity, fromECS?: boolean): void;
    dispose?(): void;
}

export const SYSTEM_PROPERTIES = {
    entityMap:()=>{return Object.create(null);},
    entities:()=>{return [];},
    events:()=>{return new EventEmitter();}
};

export class System implements ISystem {
    readonly entityMap: {[id: string]: number};
    readonly entities: IEntity[];
    readonly events: EventEmitter;

    constructor() {
        this.entityMap = SYSTEM_PROPERTIES.entityMap();
        this.entities = SYSTEM_PROPERTIES.entities();
        this.events = SYSTEM_PROPERTIES.events();
    }

    has(entity: IEntity): boolean {
        return !!this.entities[this.entityMap[entity.id]];
    }

    remove(entity: IEntity, fromECS: boolean=true): void {
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

export function injectSystem(system: ISystem, updateMethods: string[]) {
    Injector.inject(system, SYSTEM_PROPERTIES, SYSTEM_PROTOTYPE, SYSTEM_PROPERTY_DECORATOR);
    Injector.addNoopMethodsToPrototype(system, updateMethods);
}