import { ECS as ecs, System } from '@curbl/ecs';
import Benchmark, { Event } from 'benchmark';

const ECS = new ecs();

const suite = new Benchmark.Suite();
const entity = ECS.addEntity();

@ECS.System('InitialComponent')
class InitSystem extends System {}
ECS.addSystem(new InitSystem());

@ECS.System('TestComponent')
class TestSystem extends System {}
ECS.addSystem(new TestSystem());

@ECS.Component('InitialComponent')
class InitialComponent {
    x = 0;
}

@ECS.Component('TestComponent')
class TestComponent {}

entity.add(new InitialComponent());
ECS.update();

suite
    .add('Entity#create', function () {
        ECS.addEntity();
    })
    .add('Entity#add_component', function () {
        entity.add(new TestComponent());
    })
    .add('Entity#get_component', function () {
        entity.get<InitialComponent>('InitialComponent').x = 1;
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
        const entity = ECS.addEntity();
        entity.dispose();
    })
    .on('cycle', function (event: Event) {
        console.log(String(event.target));
    })
    .run({ async: true });
