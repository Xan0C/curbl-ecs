import { ECS as ecs } from '@curbl/ecs';
import Benchmark, { Event } from 'benchmark';

const ECS = new ecs();

const suite = new Benchmark.Suite();
const entity = ECS.createEntity();

@ECS.Component('InitialComponent')
class InitialComponent {}

@ECS.Component('TestComponent')
class TestComponent {}

entity.add(new InitialComponent());

suite
    .add('Entity#create', function () {
        ECS.createEntity();
    })
    .add('Entity#add_component', function () {
        entity.add(new TestComponent());
    })
    .add('Entity#get_component', function () {
        entity.get('InitialComponent');
    })
    .add('Entity#has_component_true', function () {
        entity.has('InitialComponent');
    })
    .add('Entity#has_component_false', function () {
        entity.has('GABABUNGA');
    })
    .add('Entity#remove_component', function () {
        entity.add(new TestComponent());
        entity.remove('TestComponent');
    })
    .add('Entity#dispose', function () {
        const entity = ECS.createEntity();
        entity.dispose();
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run();
