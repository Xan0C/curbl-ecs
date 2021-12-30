import { expect } from 'chai';
import { ECS as ecs } from '../src';
import { System } from '../src';

const ECS = new ecs();

@ECS.Component('TestComponent')
class TestComponent {}

@ECS.System('TestComponent')
class TestSystem extends System {}
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

        it('should have the component in the entity by class', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            // when
            entity.add(component);
            ECS.update();
            // then
            expect(entity.has(TestComponent)).eql(true);
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

        it('should get component from entity by class', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            entity.add(component);
            ECS.update();
            // when
            // then
            expect(entity.get(TestComponent)).eql(component);
        });
    });

    describe('#dispose', () => {
        it('should dispose entity', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            entity.add(component);
            ECS.update();
            // when
            entity.dispose();
            expect(entity.has('TestComponent')).true;
            expect(ECS.active(entity));
            ECS.update();
            // then
            expect(entity.has('TestComponent')).false;
            expect(ECS.active(entity)).false;
        });

        it('should take entity from pool', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            entity.add(component);
            entity.dispose();
            ECS.update();
            // when
            const pooled = ECS.addEntity();
            // then
            expect(pooled.__id).eq(entity.__id);
        });
    });

    describe('#pause', () => {
        it('should remove the entity from the update cycle', () => {
            // given
            const entity = ECS.addEntity(new TestComponent());
            ECS.update();
            // when
            entity.pause();
            entity.remove('TestComponent');
            ECS.update();
            // then
            expect(entity.active()).false;
            expect(entity.has('TestComponent')).true;
        });

        it('should add the entity to the update cycle on unpause', () => {
            // given
            const entity = ECS.addEntity(new TestComponent());
            ECS.update();
            entity.pause();
            entity.remove('TestComponent');
            ECS.update();
            // when
            entity.unpause();
            ECS.update();
            // then
            expect(entity.active()).true;
            expect(entity.has('TestComponent')).false;
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
        });

        it('should remove component from entity by class', () => {
            // given
            const entity = ECS.addEntity();
            const component = new TestComponent();
            entity.add(component);
            ECS.update();
            // when
            entity.remove(TestComponent);
            ECS.update();
            // then
            expect(entity.has(TestComponent)).false;
        });
    });
});
