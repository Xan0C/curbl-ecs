import Benchmark, { Event } from 'benchmark';
import { Bitmask, Entity } from '@curbl/ecs';
import { ECS } from '@curbl/ecs';

const suite = new Benchmark.Suite();
const ecs = new ECS();
const entities: any[] = [];
const map_set = new Map<Bitmask, Set<Entity>>();
const map_array = new Map<Bitmask, Entity[]>();
const bitmask = new Bitmask(32);
bitmask.set(1, 0);
map_set.set(bitmask, new Set());
map_array.set(bitmask, []);

@ecs.Component('Position')
class Position {
    x = 0;
    y = 0;
}

const removeList: Entity[] = [];
const removeSet = new Set<Entity>();

for (let i = 0; i < 1000; i++) {
    const entity = ecs.addEntity(new Position());
    entities.push(entity);
    map_set.get(bitmask)!.add(entity);
    map_array.get(bitmask)!.push(entity);
    removeList.push(entity);
    removeSet.add(entity);
}

class SmallEntity {
    components: any = {};
}

const smallList: any[] = [];
const smallMap_set = new Map<Bitmask, Set<SmallEntity>>();
smallMap_set.set(bitmask, new Set());
for (let i = 0; i < 1000; i++) {
    const entity = new SmallEntity();
    entity.components['Position'] = { x: 0, y: 0 };
    smallList.push(entity);
    smallMap_set.get(bitmask)!.add(entity);
}

suite
    .add('Map_Set#iterate', function () {
        const it = map_set.get(bitmask)!.values();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (const entity of it) {
            entity;
        }
    })
    .add('Map_Set#add', function () {
        const it = map_set.get(bitmask)!;
        for (let i = 0; i < 10; i++) {
            it.add(ecs.addEntity(new Position()));
        }
    })
    .add('Map_Array#iterate', function () {
        const entities = map_array.get(bitmask)!;
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity;
        }
    })
    .add('Map_Array#add', function () {
        const it = map_array.get(bitmask)!;
        for (let i = 0; i < 10; i++) {
            it.push(ecs.addEntity(new Position()));
        }
    })
    .add('array#iterate', function () {
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity;
        }
    })
    .add('set#remove', function () {
        removeSet.delete(entities[Math.floor(Math.random() * 100000)]);
    })
    .add('array#splice', function () {
        removeList.splice(removeList.indexOf(entities[Math.floor(Math.random() * 100000)]), 1);
    })
    .add('set#small_obj_iterate', function () {
        const it = smallMap_set.get(bitmask)!.values();
        for (const entity of it) {
            entity;
        }
    })
    .add('array#small_obj_iterate', function () {
        for (let i = 0, entity; (entity = smallList[i]); i++) {
            entity;
        }
    })
    .add('array#small_obj_iterate_yield', function () {
        for (const entity of smallList[Symbol.iterator]()) {
            entity;
        }
    })
    .add('array#iterate', function () {
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity;
        }
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
