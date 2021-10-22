import Benchmark, { Event } from 'benchmark';
import { ComponentBitMask } from '@curbl/ecs';

const suite = new Benchmark.Suite();
const bitset = new ComponentBitMask();
bitset.register('A');
bitset.register('B');
bitset.register('C');
bitset.register('D');

suite
    .add('ComponentBitMask#buildMask', function () {
        bitset.buildMask(['A', 'B', 'C', 'D']);
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run();
