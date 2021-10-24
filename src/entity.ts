import { Bitmask } from './bitmask';
import { Component } from './component';

export interface Entity {
    readonly __bitmask: Bitmask;
    get<T>(component: string): T;
    has(component: string): boolean;
    add<T>(component: T): void;
    remove(component: string): void;
    dispose(): void;
    __update(): void;
    __clear(): void;
}

export class EntityHandle implements Entity {
    readonly __bitmask: Bitmask;
    private dead: boolean;
    private dirty: boolean;
    private components: Map<string, Component>;
    private readonly updates: Map<string, { component: Component; added: boolean }>;
    private readonly markModified: (entity: Entity) => void;
    private readonly addToPool: (entity: Entity) => void;

    constructor(markModified: (entity: Entity) => void, addToPool: (entity: Entity) => void) {
        this.__bitmask = new Bitmask(32);
        this.components = new Map();
        this.updates = new Map();
        this.dirty = false;
        this.dead = false;
        this.markModified = markModified;
        this.addToPool = addToPool;
    }

    private markDirty(): void {
        if (!this.dirty) {
            this.dirty = true;
            this.markModified(this);
        }
    }

    add<T>(component: T): void {
        if (!this.dead) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.updates.set(component.constructor.__id, { component: component, added: true });
            this.markDirty();
        }
    }

    dispose(): void {
        this.dead = true;
        this.markDirty();
    }

    get<T>(component: string): T {
        return this.components.get(component) as unknown as T;
    }

    has(component: string): boolean {
        return this.components.has(component);
    }

    remove(component: string): void {
        if (!this.dead && (this.components.has(component) || this.updates.has(component))) {
            this.updates.set(component, { component: this.components.get(component)!, added: false });
            this.markDirty();
        }
    }

    __update(): void {
        if (this.dead) {
            this.__clear();
            this.addToPool(this);
            return;
        }

        const it = this.updates.values();
        for (const update of it) {
            if (update.added) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.__bitmask.set(update.component.constructor.__bit, 1);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.components.set(update.component.constructor.__id, update.component);
            } else if (update.component) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.__bitmask.set(update.component.constructor.__bit, 0);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.components.delete(update.component.constructor.__id);
            }
        }
        this.dirty = false;
        this.updates.clear();
    }

    __clear(): void {
        this.__bitmask.clear();
        this.components.clear();
        this.updates.clear();
        this.dirty = false;
        this.dead = false;
    }
}
