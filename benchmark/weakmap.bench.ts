import Benchmark, { Event } from 'benchmark';
import { Bitmask, Entity } from '@curbl/ecs';
import { ECS } from '@curbl/ecs';

const suite = new Benchmark.Suite();
const ecs = new ECS();
const entities: any[] = [];
const map_set = new Map<Bitmask, Set<Entity>>();
const map_map = new Map<Bitmask, Map<string, Entity>>();
const map_object = new Map<Bitmask, { [id: string]: Entity }>();
const map_array = new Map<Bitmask, Entity[]>();
const bitmask = new Bitmask(32);
bitmask.set(1, 0);
map_set.set(bitmask, new Set());
map_array.set(bitmask, []);
map_map.set(bitmask, new Map());
map_object.set(bitmask, Object.create(null));

@ecs.Component('Position', () => new Position())
class Position {
    x = 0;
    y = 0;
}

const removeList: Entity[] = [];
const removeSet = new Set<Entity>();

for (let i = 0; i < 100_000; i++) {
    const entity = ecs.createEntity(new Position());
    entities.push(entity);
    map_set.get(bitmask)!.add(entity);
    map_array.get(bitmask)!.push(entity);
    map_map.get(bitmask)!.set(entity.__id, entity);
    map_object.get(bitmask)![entity.__id] = entity;
    removeList.push(entity);
    removeSet.add(entity);
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
            it.add(ecs.createEntity(new Position()));
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
            it.push(ecs.createEntity(new Position()));
        }
    })
    .add('Map_Map#iterate', function () {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        for (const entity of map_map.get(bitmask)!.values()) {
            entity;
        }
    })
    .add('Map_Map#add', function () {
        const it = map_map.get(bitmask)!;
        for (let i = 0; i < 10; i++) {
            const entity = ecs.createEntity(new Position());
            it.set(entity.__id, entity);
        }
    })
    .add('Map_Obj#iterate', function () {
        const entities = Object.values(map_object.get(bitmask)!);
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity;
        }
    })
    .add('Map_Obj#add', function () {
        const it = map_object.get(bitmask)!;
        for (let i = 0; i < 10; i++) {
            const entity = ecs.createEntity(new Position());
            it[entity.__id] = entity;
        }
    })
    .add('array#iterate', function () {
        for (let i = 0, entity; (entity = entities[i]); i++) {
            entity;
        }
    })
    .add('array#splice', function () {
        removeList.splice(removeList.indexOf(entities[Math.floor(Math.random() * 100000)]), 1);
    })
    .add('set#remove', function () {
        removeSet.delete(entities[Math.floor(Math.random() * 100000)]);
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
