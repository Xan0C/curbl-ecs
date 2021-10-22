import { Entity, EntityHandle } from './entity';
import { uuid } from './uuid';
import { injectSystem, System } from './system';
import { ComponentBitMask } from './componentBitMask';

export class ECS {
    private readonly componentBitMask: ComponentBitMask;
    private updateCycleMethods: string[];
    private entities: { [id: string]: Entity | undefined };
    private deletedEntities: Entity[];
    private modifiedEntities: Entity[];
    private entityPool: Entity[];
    private systems: System[];

    constructor() {
        this.entities = Object.create(null);
        this.componentBitMask = new ComponentBitMask();
        this.modifiedEntities = [];
        this.deletedEntities = [];
        this.entityPool = [];
        this.systems = [];
        this.updateCycleMethods = ['update'];
    }

    setUpdateCycleMethods(methods: string[]): void {
        this.updateCycleMethods = methods;
    }

    reset(full = false): void {
        this.entities = Object.create(null);
        this.modifiedEntities = [];
        this.deletedEntities = [];
        this.systems = [];
        if (full) {
            this.updateCycleMethods = ['update'];
            this.entityPool = [];
            this.componentBitMask.clear();
        }
    }

    createEntity(...components: unknown[]): Entity {
        const handle = this.entityPool.pop() || new EntityHandle(uuid(), this);
        this.entities[handle.__id] = handle;
        for (let i = 0, component: any; (component = components[i]); i++) {
            handle.add(component);
        }
        return handle;
    }

    hasEntity(id: string): boolean {
        return !!this.entities[id];
    }

    __removeEntity(id: string): void {
        this.deletedEntities.push(this.entities[id]!);
    }

    __markEntityAsModified(id: string): void {
        this.modifiedEntities.push(this.entities[id]!);
    }

    addSystem(system: System): void {
        if (!this.hasSystem(system)) {
            this.systems.push(system);
            injectSystem(system, this.updateCycleMethods);
            system.setUp();
            system.updateEntities(Object.values(this.entities) as Entity[]);
        }
    }

    removeSystem(system: System): void {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            this.systems.splice(index, 1);
            system.tearDown();
        }
    }

    hasSystem(system: System): boolean {
        return this.systems.includes(system);
    }

    Component(id: string) {
        const bitPos = this.componentBitMask.register(id);
        return function <T extends { new (...args: any[]): object }>(constructor: T) {
            return class extends constructor {
                __id = id;
                __bit = bitPos;
            };
        };
    }

    System(...components: [string, ...string[]]) {
        for (let i = 0, component; (component = components[i]); i++) {
            this.componentBitMask.register(component);
        }
        const bitmask = this.componentBitMask.buildMask(components);
        return function <T extends { new (...args: any[]): any }>(constructor: T) {
            return class extends constructor {
                __bitmask = bitmask;
            };
        };
    }

    private callMethodOnSystems(
        method: string,
        a1?: any,
        a2?: any,
        a3?: any,
        a4?: any,
        a5?: any,
        a6?: any,
        a7?: any,
        a8?: any,
        a9?: any
    ): void {
        for (let i = 0, system: any; (system = this.systems[i]); i++) {
            system[method](a1, a2, a3, a4, a5, a6, a7, a8, a9);
        }
    }

    private deleteEntities(): void {
        for (let i = 0, entity; (entity = this.deletedEntities[i]); i++) {
            entity.__clear();
            this.entityPool.push(entity);
            delete this.entities[entity.__id];
        }
        this.deletedEntities.length = 0;
    }

    private updateEntities(): void {
        for (let i = 0, entity; (entity = this.modifiedEntities[i]); i++) {
            entity.__update();
        }

        for (let i = 0, system; (system = this.systems[i]); i++) {
            system.updateEntities(this.modifiedEntities);
        }

        this.modifiedEntities.length = 0;
    }

    update(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        if (this.deletedEntities.length > 0) {
            this.deleteEntities();
        }
        if (this.modifiedEntities.length > 0) {
            this.updateEntities();
        }
        for (let i = 0, method; (method = this.updateCycleMethods[i]); i++) {
            this.callMethodOnSystems(method, a1, a2, a3, a4, a5, a6, a7, a8, a9);
        }
    }
}
