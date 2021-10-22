import { expect } from 'chai';
import { ECS as ecs } from '../src';

const ECS = new ecs();

@ECS.Component('TestComponent')
class TestComponent {}

describe('Entity', function () {
    describe('#create', () => {
        it('should create a new entity handle', () => {
            const entity = ECS.createEntity();
            expect(entity).not.eq(undefined);
        });

        it('should create a new entity handle with components', () => {
            const entity = ECS.createEntity(new TestComponent());
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
            // then
            expect(entity.has('TestComponent')).eql(true);
        });

        it('should not have the component in the entity', () => {
            // given
            const entity = ECS.createEntity();
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

    describe('#dispose', () => {
        it('should dispose entity from the ecs', () => {
            // given
            const entity = ECS.createEntity('myEntity');
            const component = new TestComponent();
            entity.add(component);
            // when
            entity.dispose();
            ECS.update();
            // then
            expect(ECS.hasEntity(entity.__id)).false;
        });
    });
});
