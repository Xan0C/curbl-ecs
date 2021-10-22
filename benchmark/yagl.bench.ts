import Benchmark, { Event } from 'benchmark';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ECS from 'yagl-ecs';

const suite = new Benchmark.Suite();

// function makeid(length: number): string {
//     let result = '';
//     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     const charactersLength = characters.length;
//     for (let i = 0; i < length; i++) {
//         result += characters.charAt(Math.floor(Math.random() * charactersLength));
//     }
//     return result;
// }

const Position = {
    // you can access the component data on each entity with `entity.components.pos`
    name: 'pos',
    // defaults attributes for the component. If not precised a void object {}
    // is assigned instead.
    defaults: { x: 0, y: 0 },
};

class Gravity extends ECS.System {
    test(entity: any) {
        // the entity must have a position component
        return !!entity.components.pos;
    }
    enter(_: any) {}
    update(_: any) {}
    exit(_: any) {}
}

const ecs = new ECS();
ecs.addSystem(new Gravity());

const entities: any[] = [];
for (let i = 0; i < 100_000; i++) {
    const entity = new ECS.Entity([Position]);
    ecs.addEntity(entity);
    entities.push(entity);
}

// Note(Sören): goal is minimum of 150 ops/s which to be fair is way to slow
suite
    .add('yagl#update_100k_entities_1System_1Component_no_change', function () {
        ecs.update();
    })
    .add('yagl#add_and_remove_1000Entities', function () {
        for (let i = 0; i < 1000; i++) {
            ecs.removeEntity(entities[i]);
            const entity = new ECS.Entity([Position]);
            ecs.addEntity(entity);
            entities.push(entity);
        }
        ecs.update();
    })
    .on('start', function () {
        ecs.update();
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run();
