import { EntityComponentManager } from './EntityComponentManager';
import { EntitySystemManager } from './EntitySystemManager';
import { ComponentBitmaskMap } from './ComponentBitmaskMap';
import EventEmitter from 'eventemitter3';

export interface EntityComponentBase {
    events: EventEmitter;
    ecm: EntityComponentManager;
    scm: EntitySystemManager;
    componentBitmaskMap: ComponentBitmaskMap;

    update(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void;
    addWorker(worker: Worker): void;
    init(cb: () => void): void;
}
