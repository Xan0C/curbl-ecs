import { CurblECSIntComponent } from './component';
import { EntityStore } from './entityStore';
import { Bitmask } from './bitmask';

export interface Entity {
    __id: string;
    __bitmask: Bitmask;
    get<T>(component: string | (new (...args: any[]) => T)): T;
    has<T>(component: string | (new (...args: any[]) => T)): boolean;
    add<T>(component: T): void;
    remove<T>(component: string | (new (...args: any[]) => T)): void;
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
    private readonly components: Map<string, CurblECSIntComponent>;
    private readonly updates: Map<string, { component: CurblECSIntComponent; added: boolean }>;
    private readonly removedComponents: CurblECSIntComponent[];

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

    private addComponent(component: CurblECSIntComponent): void {
        this.updates.set(component.constructor.__id, { component: component, added: true });
        this.markDirty();
    }

    add<T>(component: T): void {
        if (!this.dead) {
            const comp = component as unknown as CurblECSIntComponent;
            if (comp.load) {
                comp.load().then(() => this.addComponent(comp));
            } else {
                this.addComponent(comp);
            }
        }
    }

    get<T>(component: string | (new (...args: any[]) => T)): T {
        if (typeof component === 'string') {
            return this.components.get(component) as unknown as T;
        }
        return this.components.get((component as unknown as any).__id) as unknown as T;
    }

    has<T>(component: string | (new (...args: any[]) => T)): boolean {
        if (typeof component === 'string') {
            return this.components.has(component);
        }
        return this.components.has((component as unknown as any).__id);
    }

    private removeComponent(id: string): void {
        this.updates.set(id, { component: this.components.get(id)!, added: false });
        this.markDirty();
    }

    remove<T>(component: string | (new (...args: any[]) => T)): void {
        const id = typeof component === 'string' ? component : (component as unknown as any).__id;
        if (!this.dead && (this.components.has(id) || this.updates.has(id))) {
            const component = this.components.get(id)!;
            if (component.unload) {
                component.unload().then(() => this.removeComponent(id));
            } else {
                this.removeComponent(id);
            }
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

    private __add(component: CurblECSIntComponent): void {
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
