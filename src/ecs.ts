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
     * the group property allows to add different structs as the same ComponentType. 
     * e.g.
     * class Shape {
     *  type: string;
     * }
     * 
     * @ECS.Component('quad', 'shape')
     * class Quad extends Shape {
     *  size: number;
     * }
     * 
     * @ECS.Component('rectangle', 'shape')
     * class Rectangle extends Shape {
     *  width: number;
     *  height: number
     * }
     * 
     * @ECS.System('shape')
     * class ShapeSystem extends System {
     *  update() {
     *      const entity = this.entities[0];
     *      // could have rectangle
     *      entity.get('rectangle');
     *      // or quad component
     *      entity.get('quad');    
     *  }
     * }
     * *internal* sets the static __id, __group and __bit property
     * @param id
     * @param group {optional} - add this component to a group
     * @constructor
     */
    Component(id: string, group?: string) {
        const bitPos = this.componentBitMask.register(group || id);
        return function <T extends { new (...args: any[]): any }>(constructor: T) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__id = id;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__bit = bitPos;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            constructor.__group = group || id;
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
