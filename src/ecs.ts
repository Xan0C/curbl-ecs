import { Entity } from './entity';
import { System } from './system';
import { ComponentRegister } from './componentRegister';
import { EntityStore } from './entityStore';
import { SystemStore } from './systemStore';
import { OnEntityAdded, OnEntityRemoved } from './queryStore';

export class ECS {
    private readonly entityStore: EntityStore;
    private readonly systemStore: SystemStore;
    private readonly componentBitMask: ComponentRegister;

    constructor() {
        this.entityStore = new EntityStore();
        this.systemStore = new SystemStore();
        this.componentBitMask = new ComponentRegister();
    }

    setMaxEntityPoolSize(size: number): void {
        this.entityStore.setMaxPoolSize(size);
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

    active(entity: Entity): boolean {
        return this.entityStore.active(entity);
    }

    removeSystem(system: System): void {
        this.systemStore.removeSystem(system);
    }

    hasSystem(system: System): boolean {
        return this.systemStore.hasSystem(system);
    }

    /**
     * Register as a Component
     *
     * @ECS.Component('quad')
     * class Quad {
     *  size: number;
     * }
     *
     * @ECS.System('quad')
     * class QuadSystem extends System {
     *  update() {
     *      const entity = this.entities[0];
     *      entity.get('quad');
     *  }
     * }
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

    /**
     * register as system
     * a system gets all entities with the specified components
     * @ECS.Component('position')
     * class Position { x = 0; y = 0; }
     * @ECS.System('position')
     * class PositionSystem extends System {}
     * @param components
     * @returns
     */
    System(...components: [string, ...string[]] | [new (...args: any[]) => any, ...(new (...args: any[]) => any)[]]) {
        for (let i = 0, component; (component = components[i]); i++) {
            if (typeof component === 'string') {
                this.componentBitMask.register(component);
            } else {
                this.componentBitMask.register((component as unknown as any).__id);
            }
        }
        const bitmask = this.componentBitMask.buildMask(components);
        const [query, mask] = this.entityStore.registerQuery(bitmask);
        const store = this.entityStore;
        return function <T extends { new (...args: any[]): any }>(constructor: T) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__entities = query;
            return class extends constructor {
                constructor(...args: any[]) {
                    super(...args);
                    if (this['onEntityAdded']) {
                        store.addQueryOnAdded(mask, this as unknown as OnEntityAdded);
                    }
                    if (this['onEntityRemoved']) {
                        store.addQueryOnRemoved(mask, this as unknown as OnEntityRemoved);
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
