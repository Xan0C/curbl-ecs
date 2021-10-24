import { expect } from 'chai';
import { ECS as ecs } from '../src';
import { System, Entity } from '../src';

const ECS = new ecs();

@ECS.Component('TestComponent')
class TestComponent {}

@ECS.System('TestComponent')
class TestSystem extends System {
    setUp(): void {}
    tearDown(): void {}
    onEntityAdded(_: Entity): void {}
    onEntityRemoved(_: Entity): void {}
}
ECS.addSystem(new TestSystem());

describe('Entity', function () {
    describe('#create', () => {
        it('should create a new entity handle', () => {
            const entity = ECS.createEntity();
            expect(entity).not.eq(undefined);
        });

        it('should create a new entity handle with components', () => {
            const entity = ECS.createEntity(new TestComponent());
            ECS.update();
            expect(entity).not.eq(undefined);
            expect(entity.has('TestComponent')).true;
        });
    });

    describe('#add', () => {
        it('should add a component to the entity ', () => {
            // given
            const entity = ECS.createEntity();
            const component = new TestComponent();
            // when
            entity.add(component);
            ECS.update();
            // then
            expect(entity.get('TestComponent')).eql(component);
        });
    });

    describe('#has', () => {
        it('should have the component in the entity', () => {
            // given
            const entity = ECS.createEntity();
            const component = new TestComponent();
            // when
            entity.add(component);
            ECS.update();
            // then
            expect(entity.has('TestComponent')).eql(true);
        });

        it('should not have the component in the entity', () => {
            // given
            const entity = ECS.createEntity();
            ECS.update();
            // when
            // then
            expect(entity.has('TestComponent')).eql(false);
        });
    });

    describe('#get', () => {
        it('should get component from entity', () => {
            // given
            const entity = ECS.createEntity();
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
            const entity = ECS.createEntity();
            const component = new TestComponent();
            entity.add(component);
            // when
            entity.remove('TestComponent');
            ECS.update();
            // then
            expect(entity.has('TestComponent')).false;
        });
    });
});
