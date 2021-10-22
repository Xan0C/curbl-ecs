import { Bitmask } from './bitmask';
import { addNoopMethodsToPrototype } from './injector';
import { Entity } from './entity';

export abstract class System {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    private readonly __bitmask: Bitmask;
    private readonly __entities: { [id: string]: boolean };
    entities: Entity[];

    constructor() {
        this.entities = [];
        this.__entities = Object.create(null);
    }

    protected abstract onEntityAdded(entity: Entity): void;
    protected abstract onEntityRemoved(entity: Entity): void;

    /**
     * called when the systems gets added to the ecs
     */
    abstract setUp(): void;

    /**
     * called when the system gets removed from the ecs
     */
    abstract tearDown(): void;

    private addEntity(entity: Entity): void {
        if (!this.__entities[entity.__id]) {
            this.entities.push(entity);
            this.__entities[entity.__id] = true;
            this.onEntityAdded(entity);
        }
    }

    updateEntities(entities: Entity[]): void {
        for (let i = 0, entity; (entity = entities[i]); i++) {
            if (this.__bitmask.compareAnd(entity.__bitmask)) {
                this.addEntity(entity);
            } else if (this.__entities[entity.__id]) {
                this.entities.splice(this.entities.indexOf(entity), 1);
                this.__entities[entity.__id] = false;
                this.onEntityRemoved(entity);
            }
        }
    }
}

export function injectSystem<T extends System>(system: T, updateMethods: string[]): T {
    addNoopMethodsToPrototype(system, updateMethods);
    return system;
}
