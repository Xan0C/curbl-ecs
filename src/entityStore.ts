/**
 * Stores all entities and make them easily accessible for the systems
 * Reduce work of systems that store the same entities
 */
import { Bitmask } from './bitmask';
import { Entity, EntityHandle } from './entity';
import { uuid } from './uuid';
import { ECS } from './ecs';

export class EntityStore {
    private readonly ecs: ECS;
    private pool: Entity[] = [];
    private queries: Map<Bitmask, Set<Entity>> = new Map();
    private modified: Set<Entity> = new Set();

    constructor(ecs: ECS) {
        this.ecs = ecs;
    }

    registerQuery(bitmask: Bitmask): Set<Entity> {
        const query = new Set<Entity>();
        this.queries.set(bitmask, query);
        return query;
    }

    create(components: unknown[]): Entity {
        const handle = this.pool.pop() || new EntityHandle(uuid(), this.ecs);
        for (let i = 0, component: any; (component = components[i]); i++) {
            handle.add(component);
        }
        return handle;
    }

    markModified(entity: Entity): void {
        this.modified.add(entity);
    }

    update(): void {
        if (!this.modified.size) {
            return;
        }

        const it = this.modified.values();
        for (const entity of it) {
            entity.__update();
            for (const [mask, entities] of this.queries.entries()) {
                if (mask.compareAnd(entity.__bitmask)) {
                    entities.add(entity);
                } else {
                    entities.delete(entity);
                }
            }
        }
        this.modified.clear();
    }

    clear(): void {
        this.modified.clear();
        const it = this.queries.values();
        for (const entities of it) {
            entities.clear();
        }
    }
}
