import { injectSystem, System } from './System';
import {Entity} from "./EntityHandle";
import {ComponentBitmaskMap} from "./Component";
import * as EventEmitter from "eventemitter3";
import {ESM_EVENTS, SYSTEM_EVENTS} from "./Events";

export class EntitySystemManager {
    private componentBitmask: ComponentBitmaskMap;
    private _events: EventEmitter;

    private ids: string[];
    private systems: {[id: string]: System};

    private _systemUpdateMethods: string[];

    constructor(componentBitmaskMap: ComponentBitmaskMap, events: EventEmitter){
        this._events = events;
        this._systemUpdateMethods = ['update'];
        this.componentBitmask = componentBitmaskMap;
        this.systems = Object.create(null);
        this.ids = [];
    }

    /**
     * update the system bitmask
     * @param system
     * @param componentMask
     */
    updateBitmask(system: System, componentMask: {new(config?: {[x: string]: any}): any}[]=[]): System{
        for(let i = 0, component; component = componentMask[i]; i++){
            system.bitmask = system.bitmask | this.componentBitmask.get(component);
        }
        return system;
    }

    /**
     * Add the system to the ECS so its methods will be called by the update methods
     * Before the existing entities get added into the system the setUp method is called
     * @param system
     * @param componentMask - componentBitmask for the System
     * @param silent - if true the ECS wont be notified that a System got added to the ECS
     */
    add<T extends System>(system: T, componentMask: {new(config?: {[x: string]: any}): any}[]=[] ,silent: boolean=false): T {
        if(!this.has(system)) {
            injectSystem(system, this.systemUpdateMethods);
            this.systems[system.id] = system;
            this.ids.push(system.id);
            this.updateBitmask(system, componentMask);
            system.setUp();
            if(!silent){
                this._events.emit(ESM_EVENTS.SYSTEM_ADDED,system);
            }
        }else{
            console.warn('System '+system+' already exists! And can only exists ones');
        }
        return system;
    }

    /**
     * Checks if the system is in the ECS
     * @param system
     * @returns {boolean}
     */
    has(system: System): boolean {
        return !!this.systems[system.id];
    }

    /**
     * Checks if a system of the class exists in the ECS
     * @param constructor
     * @returns {boolean}
     */
    hasOf<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): boolean{
        return !!this.systems[constructor.prototype.constructor.name];
    }

    /**
     * Removes the system
     * @param system
     * @param silent
     * @returns {boolean}
     */
    remove(system: System,silent: boolean=false): boolean{
        if(this.has(system)) {
            if(!silent){
                this._events.emit(ESM_EVENTS.SYSTEM_REMOVED, system);
            }
            system.tearDown();
            this.ids.splice(this.ids.indexOf(system.id),1);
            return delete this.systems[system.id];
        }
        return false;
    }

    /**
     * Removes the System of the provided type from the ECS
     * @param constructor
     * @param silent
     * @returns {boolean}
     */
    removeOf<T extends System>(constructor: {new(config?: {[x: string]: any}): T}, silent?: boolean): boolean{
        return this.remove(this.get(constructor), silent);
    }

    /**
     * Returns entities for the system of the type if it exists in the ECS
     * @param constructor
     * @returns {undefined|Map<string, Entity>}
     */
    getEntitiesOf<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): Entity[]{
        let system = this.get(constructor);
        if(system){
            return system.entities;
        }
        return undefined;
    }

    getComponentMaskOf<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): number{
        let system = this.get(constructor);
        if(system){
            return system.bitmask;
        }
        return undefined;
    }

    get<T extends System>(constructor: {new(config?: {[x: string]: any}): T}): T{
        return this.systems[constructor.prototype.constructor.name] as T;
    }

    /**
     * Adds the entity to the system, or adds it to all Systems
     * @param entity
     * @param system - optional system to add the entity to
     */
    addEntity(entity: Entity, system?: System): void{
        if(system){
            if(system.bitmask !== 0 && (entity.bitmask & system.bitmask) === system.bitmask){
                system.entityMap[entity.id] = system.entities.push(entity) - 1;
                system.events.emit(SYSTEM_EVENTS.ENTITY_ADDED, entity);
            }
        }else{
            const ids = this.ids;
            const systems = this.systems;
            for(let i=0, system: System; system = systems[ids[i]]; i++){
                this.addEntity(entity, system);
            }
        }
    }

    /**
     * Removes an entity from the system or all systems
     * @param entity
     * @param system
     */
    removeEntity(entity: Entity, system?: System): void{
        if(system) {
            const idx = system.entityMap[entity.id];
            if (idx >= 0) {
                system.entities.splice(idx, 1);
                delete system.entityMap[entity.id];
            }
            system.events.emit(SYSTEM_EVENTS.ENTITY_REMOVED, entity);
        }else{
            const ids = this.ids;
            const systems = this.systems;
            for(let i=0, system: System; system = systems[ids[i]]; i++){
                this.removeEntity(entity, system);
            }
        }
    }

    /**
     * Updates the Entity adds it to the right systems and removes it from systems if it does not fit anymore
     * @param entity
     * @param system - optional only update for for the given system(ether add or remove the entity from the system)
     */
    updateEntity(entity: Entity, system?: System): void{
        if(system){
            this.addEntityToSystem(system,entity);
        }else {
            const ids = this.ids;
            const systems = this.systems;
            for(let i=0, system; system = systems[ids[i]]; i++){
                this.addEntityToSystem(system, entity);
            }
        }
    }

    private updateSystemEntity(entity: Entity, system: System): void {
        if(system.bitmask !== 0 && (entity.bitmask & system.bitmask) === system.bitmask){
            const idx = system.entityMap[entity.id];
            system.entities[idx] = entity;
        }
    }

    private addEntityToSystem(system: System,entity: Entity): void{
        if ((entity.bitmask & system.bitmask) === system.bitmask) {
            if(!system.has(entity)) {
                this.addEntity(entity, system);
            } else {
                this.updateSystemEntity(entity, system);
            }
        } else if (system.has(entity)) {
            this.removeEntity(entity, system);
        }
    }

    /**
     * Calls the Method for all Systems and Subsystems
     */
    callSystemMethod(id: string,a1?: any,a2?: any,a3?: any,a4?: any,a5?: any,a6?: any,a7?: any,a8?: any,a9?: any) {
        const ids = this.ids;
        const systems = this.systems;
        for(let i=0, system; system = systems[ids[i]]; i++){
            system[id](a1,a2,a3,a4,a5,a6,a7,a8,a9);
        }
    }

    /**
     * Calls all system update methods for all system and child systems
     */
    update(a1?: any,a2?: any,a3?: any,a4?: any,a5?: any,a6?: any,a7?: any,a8?: any,a9?: any): void {
        for(let i = 0, method; method = this._systemUpdateMethods[i]; i++) {
            this.callSystemMethod(method,a1,a2,a3,a4,a5,a6,a7,a8,a9);
        }
    }

    /**
     * Injects the SystemMethods into all systems if the methods does not exist a noop method will be added
     */
    updateSystemMethods(): void{
        const ids = this.ids;
        const systems = this.systems;
        const methods = this.systemUpdateMethods;
        for(let i=0, system; system = systems[ids[i]]; i++){
            injectSystem(system,methods);
        }
    }

    public get events(): EventEmitter {
        return this._events;
    }

    public get systemUpdateMethods(): string[] {
        return this._systemUpdateMethods;
    }

    public set systemUpdateMethods(value: string[]) {
        this._systemUpdateMethods = value;
        this.updateSystemMethods();
    }
}