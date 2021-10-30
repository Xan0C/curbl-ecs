import { Bitmask } from './bitmask';
import { Component } from './component';

export interface Entity {
    readonly __bitmask: Bitmask;
    get<T>(component: string): T;
    group<T>(group: string): T[];
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
    private readonly groups: Map<string, Set<Component>>;
    private components: Map<string, Component>;
    private readonly updates: Map<string, { component: Component; added: boolean }>;
    private readonly markModified: (entity: Entity) => void;
    private readonly addToPool: (entity: Entity) => void;

    constructor(markModified: (entity: Entity) => void, addToPool: (entity: Entity) => void) {
        this.__bitmask = new Bitmask(32);
        this.components = new Map();
        this.updates = new Map();
        this.groups = new Map();
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
            const comp = component as unknown as Component;
            this.updates.set(comp.constructor.__id, { component: comp, added: true });
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

    group<T>(group: string): T[] {
        return Array.from(this.groups.get(group)! as unknown as Set<T>);
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

    private __add(component: Component): void {
        if (!this.groups.has(component.constructor.__group)) {
            this.groups.set(component.constructor.__group, new Set());
        }
        this.__bitmask.set(component.constructor.__bit, 1);
        this.components.set(component.constructor.__id, component);
        this.groups.get(component.constructor.__group)!.add(component);
    }

    private __remove(component: Component): void {
        if (!this.groups.has(component.constructor.__group)) {
            this.groups.set(component.constructor.__group, new Set());
        }
        this.__bitmask.set(component.constructor.__bit, 0);
        this.components.delete(component.constructor.__id);
        this.groups.get(component.constructor.__group)!.delete(component);
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
                this.__add(update.component);
            } else if (update.component) {
                this.__remove(update.component);
            }
        }
        this.dirty = false;
        this.updates.clear();
    }

    __clear(): void {
        this.__bitmask.clear();
        this.components.clear();
        this.groups.clear();
        this.updates.clear();
        this.dirty = false;
        this.dead = false;
    }
}
