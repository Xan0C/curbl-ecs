import { addNoopMethodsToPrototype } from './injector';
import { Entity } from './entity';

export abstract class System {
    /**
     * called when the systems gets added to the ecs
     */
    abstract setUp(): void;

    /**
     * called when the system gets removed from the ecs
     */
    abstract tearDown(): void;

    entities(): Entity[] {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.constructor.__entities;
    }
}

export function injectSystem<T extends System>(system: T, updateMethods: string[]): T {
    addNoopMethodsToPrototype(system, updateMethods);
    return system;
}
