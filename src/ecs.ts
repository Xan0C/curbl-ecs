import { Entity } from './entity';
import { System } from './system';
import { ComponentRegister } from './componentRegister';
import { EntityStore } from './entityStore';
import { SystemStore } from './systemStore';

export class ECS {
    private readonly entityStore: EntityStore;
    private readonly systemStore: SystemStore;
    private readonly componentBitMask: ComponentRegister;

    constructor() {
        this.entityStore = new EntityStore();
        this.systemStore = new SystemStore();
        this.componentBitMask = new ComponentRegister();
    }

    setUpdateMethods(methods: string[]): void {
        this.systemStore.setUpdateMethods(methods);
    }

    reset(): void {
        this.systemStore.clear();
        this.entityStore.clear();
    }

    addEntity(...components: unknown[]): Readonly<Entity> {
        return this.entityStore.create(components);
    }

    addSystem(system: System): void {
        this.systemStore.addSystem(system);
    }

    removeSystem(system: System): void {
        this.systemStore.removeSystem(system);
    }

    hasSystem(system: System): boolean {
        return this.systemStore.hasSystem(system);
    }

    /**
     * Register as a Component
     * *internal* sets the static __id and __bit property
     * @param id
     * @constructor
     */
    Component(id: string) {
        const bitPos = this.componentBitMask.register(id);
        return function <T extends { new (...args: any[]): any }>(constructor: T) {
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

    update(a1?: any, a2?: any, a3?: any, a4?: any, a5?: any, a6?: any, a7?: any, a8?: any, a9?: any): void {
        this.entityStore.update();
        this.systemStore.update(a1, a2, a3, a4, a5, a6, a7, a8, a9);
    }
}
