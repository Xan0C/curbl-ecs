import Benchmark, { Event } from 'benchmark';
import { ECS as ecs } from '@curbl/ecs';
import { Entity, System } from '@curbl/ecs';

const ECS = new ecs();

const suite = new Benchmark.Suite();

// @ECS.Component('Name', (name: string) => new NameComponent().init(name))
// class NameComponent {
//     name = '';
//
//     init(name: string): this {
//         this.name = name;
//         return this;
//     }
// }

@ECS.Component('Position', (x: number, y: number) => new PositionComponent().init(x, y))
class PositionComponent {
    x = 0;
    y = 0;
    init(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }
}
for (let i = 0; i < 10000; i++) {
    ECS.__removeComponent(new PositionComponent() as any);
}

@ECS.System('Position')
class PositionSystem extends System {
    onEntityAdded(_: Entity): void {}

    onEntityRemoved(_: Entity): void {}

    setUp(): void {}

    tearDown(): void {}

    update(): void {
        for (let i = 0, entity; (entity = this.entities[i]); i++) {
            entity;
        }
    }
}

const entities: Entity[] = [];

for (let i = 0; i < 50; i++) {
    ECS.addSystem(new PositionSystem());
}
for (let i = 0; i < 100_000; i++) {
    const entity = ECS.createEntity();
    entity.add(ECS.createComponent('Position', 1, 2));
    entities.push(entity);
}
ECS.update();

// Note(Sören): goal is minimum of 150 ops/s which to be fair is way to slow
suite
    .add('ECS#update_100k_entities_1System_1Components_no_change', function () {
        ECS.update();
    })
    .add('ECS#add_and_remove_entities_1k_1Component', function () {
        for (let i = 0; i < 1000; i++) {
            entities[i]!.dispose();
            const entity = ECS.createEntity(ECS.createComponent('Position', 13, 14));
            entities.push(entity);
        }
        ECS.update();
    })
    .add('ECS#add_modify_1k_Entities', function () {
        for (let i = 0; i < 1000; i++) {
            if (Math.random() > 0.5) {
                entities[i]!.remove('Position');
            } else {
                entities[i]!.add(ECS.createComponent('Position', 12, 3));
            }
        }
        ECS.update();
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
