import { ECS as ecs } from '../src';
import { System, Entity } from '../src';
import { expect } from 'chai';

const ECS = new ecs();

@ECS.System('TestComponent')
class TestSystem extends System {
    setUpCalled = false;
    tearDownCalled = false;

    setUp(): void {
        this.setUpCalled = true;
    }

    tearDown(): void {
        this.tearDownCalled = true;
    }

    onEntityAdded(_: Entity): void {}

    onEntityRemoved(_: Entity): void {}
}

@ECS.Component('TestComponent', () => new TestComponent())
class TestComponent {}

describe('System', function () {
    describe('#create', () => {
        it('should create a new system and add it to the ecs', () => {
            /// given
            const system = new TestSystem();
            // when
            ECS.addSystem(system);
            // then
            expect(ECS.hasSystem(system)).true;
            expect(system.setUpCalled).true;
        });

        it('should add the matching entities to the system', () => {
            /// given
            const system = new TestSystem();
            const entity = ECS.createEntity(new TestComponent());
            // when
            ECS.addSystem(system);
            // then
            expect(ECS.hasSystem(system)).true;
            expect(system.entities.includes(entity)).true;
        });
    });

    describe('#remove', () => {
        it('should remove system from ecs', () => {
            /// given
            const system = new TestSystem();
            ECS.addSystem(system);
            // when
            ECS.removeSystem(system);
            // then
            expect(ECS.hasSystem(system)).false;
            expect(system.tearDownCalled).true;
        });
    });
});
