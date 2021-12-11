import { Component } from './component';
import { EntityStore } from './entityStore';
import { Bitmask } from './bitmask';

export interface Entity {
    __id: string;
    __bitmask: Bitmask;
    get<T>(component: string): T;
    has(component: string): boolean;
    add<T>(component: T): void;
    remove(component: string): void;
    dispose(): void;
    pause(): void;
    unpause(): void;
    active(): boolean;
    __updateMaskAndNew(): void;
    __updateRemoved(): void;
}

export class EntityHandle implements Entity {
    readonly __id: string;
    readonly __bitmask: Bitmask;
    private dead: boolean;
    private dirty: boolean;
    private paused: boolean;
    private readonly store: EntityStore;
    private readonly components: Map<string, Component>;
    private readonly updates: Map<string, { component: Component; added: boolean }>;
    private readonly removedComponents: Component[];

    constructor(id: string, store: EntityStore) {
        this.__id = id;
        this.__bitmask = new Bitmask(32);
        this.store = store;
        this.components = new Map();
        this.updates = new Map();
        this.removedComponents = [];
        this.dirty = false;
        this.dead = false;
        this.paused = false;
    }

    add<T>(component: T): void {
        if (!this.dead) {
            const comp = component as unknown as Component;
            this.updates.set(comp.constructor.__id, { component: comp, added: true });
            this.markDirty();
        }
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

    dispose(): void {
        this.dead = true;
        this.markDirty();
    }

    active(): boolean {
        return this.store.active(this);
    }

    /**
     * remove the entity from the ECS(all systems)
     * and do not handle updates, components can still be removed or added
     * but they wont be active until the entity is unpaused
     * Note: this will trigger onEntityRemoved on all systems containing the entity
     */
    pause(): void {
        if (!this.paused) {
            this.markDirty();
            this.paused = true;
        }
    }

    /**
     * unpause the entity adding it back to the ecs and all systems
     * triggering onEntityAdded for all systems again
     */
    unpause(): void {
        if (this.paused) {
            this.paused = false;
            this.store.add(this);
            this.markDirty();
        }
    }

    /**
     * update the removed components
     */
    __updateRemoved(): void {
        if (this.dead) {
            this.__clear();
            this.store.delete(this);
            return;
        }

        if (this.paused) {
            this.store.remove(this);
            return;
        }

        for (let i = 0, component; (component = this.removedComponents[i]); i++) {
            this.components.delete(component.constructor.__id);
        }

        this.removedComponents.length = 0;
    }

    /**
     * update bitmask and add new components
     * this way system update events like onEntityAdded will be called with the new components
     * and onEntityRemoved will still have the removed components
     * make sure to call __updateRemoved afterwards to actually remove the components
     */
    __updateMaskAndNew(): void {
        if (!this.dirty) {
            return;
        }

        if (this.dead || this.paused) {
            this.__bitmask.clear();
            this.dirty = false;
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

    private markDirty(): void {
        if (!this.dirty && !this.paused) {
            this.dirty = true;
            this.store.markModified(this);
        }
    }

    private __add(component: Component): void {
        this.__bitmask.set(component.constructor.__bit, 1);
        this.components.set(component.constructor.__id, component);
    }

    private __clear(): void {
        this.__bitmask.clear();
        this.components.clear();
        this.updates.clear();
        this.removedComponents.length = 0;
        this.dirty = false;
        this.dead = false;
        this.paused = false;
    }
}
