/**
 * Stores all entities and make them easily accessible for the systems
 * Reduce work of systems that store the same entities
 */
import { Bitmask } from './bitmask';
import { Entity, EntityHandle } from './entity';
import { v4 as uuidv4 } from 'uuid';
import { QueryStore } from './queryStore';

export class EntityStore {
    private readonly queryStore: QueryStore = new QueryStore();
    private readonly entities: Map<string, Entity> = new Map();
    private readonly pool: Entity[] = [];
    private modified: Entity[] = [];

    registerQuery(bitmask: Bitmask): [Entity[], Bitmask] {
        return this.queryStore.registerQuery(this.entities.values(), bitmask);
    }

    addQueryOnAdded(bitmask: Bitmask, cb: (_: Entity) => void) {
        this.queryStore.addQueryOnAdded(bitmask, cb);
    }

    addQueryOnRemoved(bitmask: Bitmask, cb: (_: Entity) => void) {
        this.queryStore.addQueryOnRemoved(bitmask, cb);
    }

    create(components: unknown[]): Entity {
        const handle = this.pool.pop() || new EntityHandle(uuidv4(), this);
        this.entities.set(handle.__id, handle);
        for (let i = 0, component: any; (component = components[i]); i++) {
            handle.add(component);
        }
        return handle;
    }

    active(entity: Entity): boolean {
        return this.entities.has(entity.__id);
    }

    add(entity: Entity): void {
        this.entities.set(entity.__id, entity);
    }

    delete(entity: Entity): void {
        this.entities.delete(entity.__id);
        this.pool.push(entity);
    }

    remove(entity: Entity): void {
        this.entities.delete(entity.__id);
    }

    markModified(entity: Entity): void {
        this.modified.push(entity);
    }

    update(): void {
        if (!this.modified.length) {
            return;
        }
        const modified = [...this.modified];
        this.queryStore.update(modified);
        this.modified = this.modified.slice(modified.length, this.modified.length);
    }

    clear(): void {
        this.modified.length = 0;
        this.entities.clear();
        this.queryStore.clear();
    }
}
