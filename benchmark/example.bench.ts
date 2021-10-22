import Benchmark, { Event } from 'benchmark';
import { Component, ECS as ecs } from '@curbl/ecs';
import { Entity, System } from '@curbl/ecs';

const ECS = new ecs();

const suite = new Benchmark.Suite();

function makeid(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

@ECS.Component('RandomComponent')
class RandomComponent implements Component {
    __id: string;
    __bit: number;
    constructor() {
        this.__id = makeid(6);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.__bit = ECS.componentBitMask.register(this.__id);
    }
}

@ECS.System('RandomComponent')
class RandomSystem extends System {
    constructor() {
        super();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.__bitmask = ECS.componentBitMask.buildMask(makeid(10));
    }

    onEntityAdded(_: Entity): void {}

    onEntityRemoved(_: Entity): void {}

    setUp(): void {}

    tearDown(): void {}

    update(): void {}
}

const entities: Entity[] = [];

// Note(Sören): goal is minimum of 150 ops/s which to be fair is way to slow
suite
    .add('ECS#update_100k_entities_50Systems_128Components_no_change', function () {
        ECS.update();
    })
    .add('ECS#add_and_remove_1000Entities', function () {
        for (let i = 0; i < 1000; i++) {
            entities[i]!.dispose();
            const entity = ECS.createEntity();
            entities.push(entity);
        }
        ECS.update();
    })
    .on('start', function () {
        for (let i = 0; i < 50; i++) {
            ECS.addSystem(new RandomSystem());
        }
        for (let i = 0; i < 100_000; i++) {
            const entity = ECS.createEntity();
            const components = Math.random() * 128;
            for (let i = 0; i < components; i++) {
                entity.add(new RandomComponent());
            }
            entities.push(entity);
        }
        ECS.update();
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run();
