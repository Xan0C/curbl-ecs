/**
 * Stores all entities and make them easily accessible for the systems
 * Reduce work of systems that store the same entities
 */
import { Bitmask } from './bitmask';
import { Entity, EntityHandle } from './entity';

type Query = {
    set: Set<Entity>;
    list: Entity[];
    onEntityAdded: ((_: Entity) => void)[];
    onEntityRemoved: ((_: Entity) => void)[];
};

export class EntityStore {
    private readonly entities: Set<Entity> = new Set<Entity>();
    private readonly pool: Entity[] = [];
    private readonly queries: Map<Bitmask, Query> = new Map<Bitmask, Query>();
    private modified: Entity[] = [];

    constructor() {
        this.markModified = this.markModified.bind(this);
        this.remove = this.remove.bind(this);
    }

    registerQuery(bitmask: Bitmask): [Entity[], Bitmask] {
        for (const mask of this.queries.keys()) {
            if (mask.isEqual(bitmask)) {
                return [this.queries.get(mask)!.list, mask];
            }
        }
        const query: Query = { set: new Set<Entity>(), list: [], onEntityAdded: [], onEntityRemoved: [] };
        const entities = this.entities.values();
        for (const entity of entities) {
            if (bitmask.compareAnd(entity.__bitmask)) {
                query.set.add(entity);
                query.list.push(entity);
            }
        }
        this.queries.set(bitmask, query);
        return [query.list, bitmask];
    }

    addQueryOnAdded(bitmask: Bitmask, cb: (_: Entity) => void) {
        this.queries.get(bitmask)!.onEntityAdded.push(cb);
    }

    addQueryOnRemoved(bitmask: Bitmask, cb: (_: Entity) => void) {
        this.queries.get(bitmask)!.onEntityRemoved.push(cb);
    }

    create(components: unknown[]): Entity {
        const handle = this.pool.pop() || new EntityHandle(this.markModified, this.remove);
        for (let i = 0, component: any; (component = components[i]); i++) {
            handle.add(component);
        }
        this.entities.add(handle);
        return handle;
    }

    private remove(entity: Entity): void {
        this.entities.delete(entity);
        this.pool.push(entity);
    }

    private markModified(entity: Entity): void {
        this.modified.push(entity);
    }

    private static callEntityAdded(entity: Entity, query: Query): void {
        for (let i = 0, cb; (cb = query.onEntityAdded[i]); i++) {
            cb(entity);
        }
    }

    private static callEntityRemoved(entity: Entity, query: Query): void {
        for (let i = 0, cb; (cb = query.onEntityRemoved[i]); i++) {
            cb(entity);
        }
    }

    private static updateQuery(entity: Entity, mask: Bitmask, query: Query): boolean {
        const and = mask.compareAnd(entity.__bitmask);
        const has = query.set.has(entity);
        if (and && !has) {
            query.set.add(entity);
            EntityStore.callEntityAdded(entity, query);
            return true;
        } else if (!and && has) {
            query.set.delete(entity);
            EntityStore.callEntityRemoved(entity, query);
            return true;
        }
        return false;
    }

    update(): void {
        if (!this.modified.length) {
            return;
        }

        const modified = [...this.modified];

        for (const [mask, query] of this.queries.entries()) {
            let updated = false;
            for (let i = 0, entity; (entity = modified[i]); i++) {
                entity.__updateMaskAndNew();
                updated = EntityStore.updateQuery(entity, mask, query) || updated;
            }
            if (updated) {
                query.list.length = 0;
                query.list.push(...Array.from(query.set));
            }
        }

        for (let i = 0, entity; (entity = modified[i]); i++) {
            entity.__updateRemoved();
        }

        this.modified = this.modified.slice(modified.length, this.modified.length);
    }

    clear(): void {
        this.modified.length = 0;
        this.entities.clear();
        const it = this.queries.values();
        for (const entities of it) {
            entities.set.clear();
            entities.list.length = 0;
        }
    }
}
