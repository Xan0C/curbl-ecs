import { Bitmask } from './bitmask';
import { Entity } from './entity';

export type OnEntityAdded = { onEntityAdded: (_: Entity) => void };
export type OnEntityRemoved = { onEntityRemoved: (_: Entity) => void };

type Query = {
    set: Set<Entity>;
    list: Entity[];
    onEntityAdded: OnEntityAdded[];
    onEntityRemoved: OnEntityRemoved[];
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

    addQueryOnAdded(bitmask: Bitmask, ctx: OnEntityAdded) {
        this.queries.get(bitmask)?.onEntityAdded.push(ctx);
    }

    addQueryOnRemoved(bitmask: Bitmask, ctx: OnEntityRemoved) {
        this.queries.get(bitmask)?.onEntityRemoved.push(ctx);
    }

    private static callEntityAdded(entity: Entity, query: Query): void {
        for (let i = 0, ctx; (ctx = query.onEntityAdded[i]); i++) {
            ctx.onEntityAdded(entity);
        }
    }

    private static callEntityRemoved(entity: Entity, query: Query): void {
        for (let i = 0, ctx; (ctx = query.onEntityRemoved[i]); i++) {
            ctx.onEntityRemoved(entity);
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
