import { expect } from 'chai';
import { ECS as ecs } from '../src';
import { System } from '../src';

const ECS = new ecs();

@ECS.Component('TestComponent', 'TestGroup')
class TestComponent {}

@ECS.Component('TestComponentTwo', 'TestGroup')
class TestComponentTwo {}

@ECS.System('TestComponent')
class TestSystem extends System {
    setUp(): void {}
    tearDown(): void {}
}
ECS.addSystem(new TestSystem());

describe('Entity', function () {
    describe('#create', () => {
        it('should create a new entity handle', () => {
            const entity = ECS.addEntity();
            expect(entity).not.eq(undefined);
        });

        it('should create a new entity handle with components', () => {
            const entity = ECS.addEntity(new TestComponent());
            ECS.update();
            expect(entity).not.eq(undefined);
            expect(entity.has('TestComponent')).true;
        });
    });

    describe('#add', () => {
        it('should add a component to the entity ', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            // when
            entity.add(component);
            ECS.update();
            // then
            expect(entity.get('TestComponent')).eql(component);
        });

        it('should add the components with the same group to the entity ', () => {
            // given
            const entity = ECS.addEntity();
            const componentOne = new TestComponent();
            const componentTwo = new TestComponentTwo();
            // when
            entity.add(componentOne);
            entity.add(componentTwo);
            ECS.update();
            // then
            expect(entity.get('TestComponent')).eql(componentOne);
            expect(entity.get('TestComponentTwo')).eql(componentTwo);
            expect(entity.group<any>('TestGroup').includes(componentOne)).eql(true);
            expect(entity.group<any>('TestGroup').includes(componentTwo)).eql(true);
            expect(entity.__bitmask.toString()).eql('00000000000000000000000000000001');
        });
    });

    describe('#has', () => {
        it('should have the component in the entity', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            // when
            entity.add(component);
            ECS.update();
            // then
            expect(entity.has('TestComponent')).eql(true);
        });

        it('should not have the component in the entity', () => {
            // given
            const entity = ECS.addEntity();
            ECS.update();
            // when
            // then
            expect(entity.has('TestComponent')).eql(false);
        });
    });

    describe('#get', () => {
        it('should get component from entity', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            entity.add(component);
            ECS.update();
            // when
            // then
            expect(entity.get('TestComponent')).eql(component);
        });
    });

    describe('#remove', () => {
        it('should remove component from entity', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            entity.add(component);
            ECS.update();
            // when
            entity.remove('TestComponent');
            ECS.update();
            // then
            expect(entity.has('TestComponent')).false;
            expect(entity.group('TestGroup')).empty;
        });
    });
});
