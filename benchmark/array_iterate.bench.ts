import Benchmark, { Event } from 'benchmark';
import { ECS, Entity, System } from '@curbl/ecs';

const suite = new Benchmark.Suite();
const ecs = new ECS();
const entities: any[] = [];

@ecs.System('Position')
class PositionSystem extends System {}
ecs.addSystem(new PositionSystem());

@ecs.Component('Position')
class Position {
    x = 0;
    y = 0;
}

class EntityBase {
    handle: Entity | undefined;
    components: Map<string, any> = new Map();

    get<T>(component: string): T {
        return this.components.get(component) as T;
    }
}

const componentsList: any[] = [];
for (let i = 0; i < 100000; i++) {
    const position = new Position();
    const entity = ecs.addEntity(position);
    entities.push(entity);
    const base = new EntityBase();
    base.handle = entity;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    base.components = entity.components;
    componentsList.push(base);
}
ecs.update();

suite
    .add('array#iterate_entity_get', function () {
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity.get('Position');
        }
    })
    .add('array#iterate_object_get', function () {
        for (let i = 0, entity; (entity = componentsList[i]); i++) {
            entity.get('Position');
        }
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
