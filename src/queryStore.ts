import { Bitmask } from './bitmask';
import { Entity } from './entity';

type Query = {
    set: Set<Entity>;
    list: Entity[];
    onEntityAdded: ((_: Entity) => void)[];
    onEntityRemoved: ((_: Entity) => void)[];
};

export class QueryStore {
    private readonly queries: Map<Bitmask, Query> = new Map<Bitmask, Query>();

    registerQuery(entities: IterableIterator<Entity>, bitmask: Bitmask): [Entity[], Bitmask] {
        for (const mask of this.queries.keys()) {
            if (mask.isEqual(bitmask)) {
                return [this.queries.get(mask)!.list, mask];
            }
        }
        const query: Query = { set: new Set<Entity>(), list: [], onEntityAdded: [], onEntityRemoved: [] };
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
        this.queries.get(bitmask)?.onEntityAdded.push(cb);
    }

    addQueryOnRemoved(bitmask: Bitmask, cb: (_: Entity) => void) {
        this.queries.get(bitmask)?.onEntityRemoved.push(cb);
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
            QueryStore.callEntityAdded(entity, query);
            return true;
        } else if (!and && has) {
            query.set.delete(entity);
            QueryStore.callEntityRemoved(entity, query);
            return true;
        }
        return false;
    }

    update(modified: Entity[]): void {
        for (const [mask, query] of this.queries.entries()) {
            let updated = false;
            for (let i = 0, entity; (entity = modified[i]); i++) {
                entity.__updateMaskAndNew();
                updated = QueryStore.updateQuery(entity, mask, query) || updated;
            }
            if (updated) {
                query.list.length = 0;
                for (const q of query.set.values()) {
                    query.list.push(q);
                }
            }
        }

        for (let i = 0, entity; (entity = modified[i]); i++) {
            entity.__updateRemoved();
        }
    }

    clear(): void {
        const it = this.queries.values();
        for (const entities of it) {
            entities.set.clear();
            entities.list.length = 0;
        }
    }
}
