import {EntityComponentManager} from "./EntityComponentManager";
import {EntitySystemManager} from "./EntitySystemManager";
import { ComponentBitmaskMap } from './ComponentBitmaskMap';
import * as EventEmitter from "eventemitter3";

export abstract class ECSBase {
    public events: EventEmitter;
    public ecm: EntityComponentManager;
    public scm: EntitySystemManager;
    public componentBitmaskMap: ComponentBitmaskMap;

    constructor(){
        this.componentBitmaskMap = new ComponentBitmaskMap();
        this.events = new EventEmitter();
        this.ecm = new EntityComponentManager(this.componentBitmaskMap, this.events);
        this.scm = new EntitySystemManager(this.componentBitmaskMap, this.events);
        this.registerEvents();
    }

    protected abstract registerEvents(): void;

    abstract update(a1?: any,a2?: any,a3?: any,a4?: any,a5?: any,a6?: any,a7?: any,a8?: any,a9?: any): void;
    abstract addWorker(worker: Worker): void;
    abstract init(cb: () => void): void;
}