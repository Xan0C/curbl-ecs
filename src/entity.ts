import { Bitmask } from './bitmask';
import { Component } from './component';

export interface Entity {
    readonly __bitmask: Bitmask;
    get<T>(component: string): T;
    has(component: string): boolean;
    add<T>(component: T): void;
    remove(component: string): void;
    dispose(): void;
    __updateMaskAndNew(): void;
    __updateRemoved(): void;
}

export class EntityHandle implements Entity {
    readonly __bitmask: Bitmask;
    private dead: boolean;
    private dirty: boolean;
    private readonly components: Map<string, Component>;
    private readonly updates: Map<string, { component: Component; added: boolean }>;
    private readonly removedComponents: Component[];
    private readonly markModified: (entity: Entity) => void;
    private readonly addToPool: (entity: Entity) => void;

    constructor(markModified: (entity: Entity) => void, addToPool: (entity: Entity) => void) {
        this.__bitmask = new Bitmask(32);
        this.components = new Map();
        this.updates = new Map();
        this.removedComponents = [];
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
        this.__bitmask.set(component.constructor.__bit, 1);
        this.components.set(component.constructor.__id, component);
    }

    /**
     * update the removed components
     */
    __updateRemoved(): void {
        if (this.dead) {
            this.__clear();
            this.addToPool(this);
            return;
        }

        for (let i = 0, component; (component = this.removedComponents[i]); i++) {
            this.components.delete(component.constructor.__id);
        }

        this.removedComponents.length = 0;
    }

    /**
     * update bitmask and add new components
     */
    __updateMaskAndNew(): void {
        if (!this.dirty) {
            return;
        }

        if (this.dead) {
            this.__bitmask.clear();
            return;
        }

        const it = this.updates.values();
        for (const update of it) {
            if (update.added) {
                this.__add(update.component);
            } else if (update.component) {
                this.__bitmask.set(update.component.constructor.__bit, 0);
                this.removedComponents.push(update.component);
            }
        }

        this.updates.clear();
        this.dirty = false;
    }

    __clear(): void {
        this.__bitmask.clear();
        this.components.clear();
        this.updates.clear();
        this.removedComponents.length = 0;
        this.dirty = false;
        this.dead = false;
    }
}
