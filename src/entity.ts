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

    private __dirty: boolean;
    private __ecs: ECS;
    private __components: { [id: string]: CurblComponent | undefined };
    private readonly __removed: CurblComponent[];

    constructor(id: string, ecs: ECS) {
        this.__id = id;
        this.__ecs = ecs;
        this.__bitmask = new Bitmask(32);
        this.__components = Object.create(null);
        this.__removed = [];
        this.__dirty = false;
    }

    private markDirty(): void {
        if (!this.__dirty) {
            this.__dirty = true;
            this.__ecs.__markEntityAsModified(this.__id);
        }
    }

    add<T>(component: T): void {
        const comp = component as unknown as CurblComponent;
        if (!this.__components[comp.__id]) {
            this.__components[comp.__id] = comp;
            this.__bitmask.set(comp.__bit, 1);
            this.markDirty();
        }
    }

    dispose(): void {
        this.__ecs.__removeEntity(this.__id);
    }

    get<T>(component: string): T {
        return this.__components[component]! as unknown as T;
    }

    has(component: string): boolean {
        return !!this.__components[component];
    }

    remove(component: string): void {
        if (this.__components[component] !== undefined && this.__removed.indexOf(this.__components[component]!) === -1) {
            this.__removed.push(this.__components[component]!);
            this.markDirty();
        }
    }

    __update(): void {
        for (let i = 0, component; (component = this.__removed[i]); i++) {
            this.__components[component.__id] = undefined;
            this.__bitmask.set(component.__bit, 0);
            this.__ecs.__removeComponent(component);
        }
        this.__dirty = false;
        this.__removed.length = 0;
    }

    __clear(): void {
        this.__bitmask.clear();
        this.__components = Object.create(null);
        this.__removed.length = 0;
        this.__dirty = false;
    }
}
