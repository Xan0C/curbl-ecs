import Benchmark, { Event } from 'benchmark';
import { Bitmask } from '@curbl/ecs';

const suite = new Benchmark.Suite();
const bitmask = new Bitmask(64);
const bitmask_two = new Bitmask(64);

suite
    .add('Bitmask#create_32', function () {
        new Bitmask(32);
    })
    .add('Bitmask#create_256', function () {
        new Bitmask(256);
    })
    .add('Bitmask#create_512', function () {
        new Bitmask(512);
    })
    .add('Bitmask#set', function () {
        bitmask.set(36, 1);
    })
    .add('Bitmask#and', function () {
        bitmask.and(bitmask_two);
    })
    .add('Bitmask#and_diff_size#with_instantiate', function () {
        const bitmask = new Bitmask(64);
        const bitmask_diff_size = new Bitmask(32);
        bitmask.and(bitmask_diff_size);
    })
    .add('Bitmask#compareAnd', function () {
        bitmask.compareAnd(bitmask_two);
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run();
