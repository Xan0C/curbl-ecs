import { ECS } from './ecs';
import { Bitmask } from './bitmask';
import { CurblComponent } from './component';

export interface Entity {
    readonly __id: string;
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
    readonly __id: string;
    readonly __bitmask: Bitmask;
    private dead: boolean;
    private dirty: boolean;
    private ecs: ECS;
    private components: Map<string, CurblComponent>;
    private readonly updates: Map<string, { component: CurblComponent; added: boolean }>;

    constructor(id: string, ecs: ECS) {
        this.__id = id;
        this.ecs = ecs;
        this.__bitmask = new Bitmask(32);
        this.components = new Map();
        this.updates = new Map();
        this.dirty = false;
        this.dead = false;
    }

    private markDirty(): void {
        if (!this.dirty) {
            this.dirty = true;
            this.ecs.__markEntityAsModified(this.__id);
        }
    }

    add<T>(component: T): void {
        if (!this.dead) {
            const comp = component as unknown as CurblComponent;
            this.updates.set(comp.__id, { component: comp, added: true });
            this.markDirty();
        }
    }

    dispose(): void {
        this.dead = true;
        this.markDirty();
        this.ecs.__removeEntity(this.__id);
    }

    get<T>(component: string): T {
        return this.components.get(component) as unknown as T;
    }

    has(component: string): boolean {
        return this.components.has(component);
    }

    remove(component: string): void {
        if (!this.dead) {
            this.updates.set(component, { component: this.components.get(component)!, added: false });
            this.markDirty();
        }
    }

    __update(): void {
        if (this.dead) {
            this.__clear();
            return;
        }

        const it = this.updates.values();
        for (const update of it) {
            if (update.added) {
                this.__bitmask.set(update.component.__bit, 1);
                this.components.set(update.component.__id, update.component);
            } else if (update.component) {
                this.__bitmask.set(update.component.__bit, 0);
                this.components.delete(update.component.__id);
                this.ecs.__removeComponent(update.component);
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
