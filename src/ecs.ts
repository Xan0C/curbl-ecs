import { Entity } from './entity';
import { injectSystem, System } from './system';
import { ComponentBitMask } from './componentBitMask';
import { EntityStore } from './entityStore';

export class ECS {
    private entityStore: EntityStore;
    private readonly componentBitMask: ComponentBitMask;
    private updateCycleMethods: string[];
    private systems: System[];

    constructor() {
        this.entityStore = new EntityStore();
        this.componentBitMask = new ComponentBitMask();
        this.systems = [];
        this.updateCycleMethods = ['update'];
    }

    setUpdateCycleMethods(methods: string[]): void {
        this.updateCycleMethods = methods;
    }

    reset(full = false): void {
        this.systems = [];
        this.entityStore.clear();
        if (full) {
            this.updateCycleMethods = ['update'];
            this.componentBitMask.clear();
        }
    }

    createEntity(...components: unknown[]): Entity {
        return this.entityStore.create(components);
    }

    addSystem(system: System): void {
        if (!this.hasSystem(system)) {
            this.systems.push(system);
            injectSystem(system, this.updateCycleMethods);
            system.setUp();
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

    /**
     * Register as a Component
     * *internal* sets the static __id and __bit property
     * @param id
     * @constructor
     */
    Component(id: string) {
        const bitPos = this.componentBitMask.register(id);
        return function <T extends { new (...args: any[]): object }>(constructor: T) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__id = id;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__bit = bitPos;
            return constructor;
        };
    }

    System(...components: [string, ...string[]]) {
        for (let i = 0, component; (component = components[i]); i++) {
            this.componentBitMask.register(component);
        }
        const bitmask = this.componentBitMask.buildMask(components);
        const query = this.entityStore.registerQuery(bitmask);
        const store = this.entityStore;
        return function <T extends { new (...args: any[]): any }>(constructor: T) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__bitmask = bitmask;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__entities = query;
            return class extends constructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this['onEntityAdded']) {
                        store.addQueryOnAdded(bitmask, this['onEntityAdded']);
                    }
                    if (this['onEntityRemoved']) {
                        store.addQueryOnRemoved(bitmask, this['onEntityRemoved']);
                    }
                }
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

    update(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        this.entityStore.update();
        for (let i = 0, method; (method = this.updateCycleMethods[i]); i++) {
            this.callMethodOnSystems(method, a1, a2, a3, a4, a5, a6, a7, a8, a9);
        }
    }
}
