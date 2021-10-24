import { ECS as ecs } from '../src';
import { expect } from 'chai';
import { Entity, System } from '../src';

const ECS = new ecs();

@ECS.Component('Position', (x: number, y: number) => new Position(x, y))
class Position {
    constructor(public x: number, public y: number) {}
}

@ECS.Component('Name', (name: string) => new Name(name))
class Name {
    constructor(public name: string) {}
}

@ECS.System('Position', 'Name')
class TestSystem extends System {
    entityLengthOnUpdate = 0;
    entitiesAdded: Entity[] = [];
    entitiesRemoved: Entity[] = [];

    setUp(): void {}

    tearDown(): void {}

    update(): void {
        this.entityLengthOnUpdate = this.entities.length;
    }

    onEntityAdded(entity: Entity) {
        this.entitiesAdded.push(entity);
    }

    onEntityRemoved(entity: Entity) {
        this.entitiesRemoved.push(entity);
    }
}

@ECS.System('Name')
class NameSystem extends System {
    setUp(): void {}

    tearDown(): void {}

    onEntityAdded(_: Entity) {}

    onEntityRemoved(_: Entity) {}
}

describe('ECS', function () {
    afterEach(() => {
        ECS.reset();
    });

    it('should create entity with Name and Position component', () => {
        // given
        const entity = ECS.createEntity(new Position(13, 37), new Name('Batman'));
        // when
        ECS.update();
        // then
        expect(entity.get<Name>('Name').name).eql('Batman');
        expect(entity.get<Position>('Position').x).eql(13);
        expect(entity.get<Position>('Position').y).eql(37);
    });

    it('should only add entities with position and name component to system', () => {
        // given
        const entity = ECS.createEntity(new Position(13, 37), new Name('Batman'));
        const positionEntity = ECS.createEntity(new Position(13, 37));
        const nameEntity = ECS.createEntity(new Name('Batman'));
        const system = new TestSystem();
        ECS.addSystem(system);
        // when
        ECS.update();
        // then
        expect(system.entityLengthOnUpdate).eql(1);
        expect(system.entities.includes(entity)).true;
        expect(system.entities.includes(positionEntity)).false;
        expect(system.entities.includes(nameEntity)).false;
    });

    it('should add entity with position and name component to name system', () => {
        // given
        const entity = ECS.createEntity(new Position(13, 37), new Name('Batman'));
        const positionEntity = ECS.createEntity(new Position(13, 37));
        const nameEntity = ECS.createEntity(new Name('Batman'));
        const system = new NameSystem();
        ECS.addSystem(system);
        // when
        ECS.update();
        // then
        expect(system.entities.includes(entity)).eql(true, 'entity with position and name should be in system');
        expect(system.entities.includes(positionEntity)).eql(false, 'entity with position should not be in system');
        expect(system.entities.includes(nameEntity)).eql(true, 'entity with name should be in system');
    });

    it('should call onEntityAdded if a entity gets added to the system', () => {
        // given
        const system = new TestSystem();
        ECS.addSystem(system);
        // when
        const entity = ECS.createEntity(new Position(13, 37), new Name('Batman'));
        ECS.update();
        // then
        expect(system.entitiesAdded.includes(entity)).true;
    });

    it('should call onEntityAdded if a component needed by the system get added to the entity', () => {
        // given
        const system = new TestSystem();
        const entity = ECS.createEntity(new Position(13, 37));
        ECS.addSystem(system);
        expect(system.entitiesAdded.includes(entity)).false;
        entity.add(new Name('Batman'));
        // when
        ECS.update();
        // then
        expect(system.entitiesAdded.includes(entity)).true;
    });

    it('should call onEntityRemoved if a entity removes a component needed by the system', () => {
        // given
        const entity = ECS.createEntity(new Position(13, 37), new Name('Batman'));
        ECS.update();
        const system = new TestSystem();
        ECS.addSystem(system);
        entity.remove('Name');
        // when
        ECS.update();
        // then
        expect(system.entitiesRemoved.includes(entity)).true;
    });

    it('should call onEntityRemoved if a entity is removed from the ecs', () => {
        // given
        const system = new TestSystem();
        ECS.addSystem(system);
        const entity = ECS.createEntity(new Position(13, 37), new Name('Batman'));
        ECS.update();
        entity.dispose();
        // when
        ECS.update();
        // then
        expect(system.entitiesRemoved.includes(entity)).true;
    });
});
