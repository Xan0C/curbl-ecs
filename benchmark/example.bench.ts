import Benchmark, { Event } from 'benchmark';
import { ECS as ecs } from '@curbl/ecs';
import { Entity, System } from '@curbl/ecs';

const ECS = new ecs();

const suite = new Benchmark.Suite();

@ECS.Component('PositionComponent')
class PositionComponent {
    x = 0;
    y = 0;
}
new PositionComponent();

@ECS.Component('ScaleComponent')
class ScaleComponent {
    x = 0;
    y = 0;
}
new ScaleComponent();

@ECS.System('PositionComponent')
class PositionSystem extends System {
    override onEntityAdded(entity: Entity): void {
        entity;
    }
    override onEntityRemoved(entity: Entity): void {
        entity;
    }

    update(): void {
        const entities = this.entities();
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity.get('PositionComponent');
        }
    }
}

@ECS.System('ScaleComponent')
class ScaleSystem extends System {
    override onEntityAdded(entity: Entity): void {
        entity;
    }
    override onEntityRemoved(entity: Entity): void {
        entity;
    }

    update(): void {
        const entities = this.entities();
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity.get('ScaleComponent');
        }
    }
}

const entities: Entity[] = [];
ECS.addSystem(new PositionSystem());
ECS.addSystem(new ScaleSystem());

for (let i = 0; i < 100_000; i++) {
    const entity = ECS.addEntity();
    entity.add(new PositionComponent());
    entity.add(new ScaleComponent());
    entities.push(entity);
}
ECS.update();

// Note(Sören): goal is minimum of 150 ops/s which to be fair is way to slow
suite
    .add('ECS#update_100k_entities_2Systems_2Components_no_change', function () {
        ECS.update();
    })
    .add('ECS#add_and_remove_entities_1k_1Component', function () {
        for (let i = 0; i < 1000; i++) {
            entities.pop()!.dispose();
            const entity = ECS.addEntity();
            entity.add(new PositionComponent());
            entities.push(entity);
        }
        ECS.update();
    })
    .add('ECS#modify_1k_Entities', function () {
        for (let i = 0; i < 1000; i++) {
            if (Math.random() > 0.5) {
                entities[i]!.remove(PositionComponent);
            } else {
                entities[i]!.add(new PositionComponent());
            }
        }
        ECS.update();
    })
    .add('ECS#add_1k_Entities_and_modify_1k', function () {
        for (let i = 0; i < 1000; i++) {
            entities.pop()!.dispose();
            const modifiedEntity = entities.pop()!;
            if (Math.random() > 0.5) {
                modifiedEntity.remove(PositionComponent);
            } else {
                modifiedEntity.add(new PositionComponent());
            }
            entities.push(modifiedEntity);
            const entity = ECS.addEntity();
            entity.add(new PositionComponent());
            entities.push(entity);
        }
        ECS.update();
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
