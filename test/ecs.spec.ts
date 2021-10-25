import { ECS as ecs } from '../src';
import { expect } from 'chai';
import { Entity, System } from '../src';

const ECS = new ecs();

@ECS.Component('Position')
class Position {
    constructor(public x: number, public y: number) {}
}

@ECS.Component('Name')
class Name {
    constructor(public name: string) {}
}

@ECS.System('Position', 'Name')
class TestSystem extends System {
    entityLengthOnUpdate = 0;
    entitiesAdded: Entity[] = [];
    entitiesRemoved: Entity[] = [];

    constructor() {
        super();
        this.onEntityAdded = this.onEntityAdded.bind(this);
        this.onEntityRemoved = this.onEntityRemoved.bind(this);
    }

    setUp(): void {}

    tearDown(): void {}

    update(): void {
        this.entityLengthOnUpdate = 0;
        const it = this.entities();
        for (const _ of it) {
            this.entityLengthOnUpdate++;
        }
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
        const entity = ECS.addEntity(new Position(13, 37), new Name('Batman'));
        // when
        ECS.update();
        // then
        expect(entity.get<Name>('Name').name).eql('Batman');
        expect(entity.get<Position>('Position').x).eql(13);
        expect(entity.get<Position>('Position').y).eql(37);
    });

    it('should only add entities with position and name component to system', () => {
        // given
        const system = new TestSystem();
        ECS.addSystem(system);
        const entity = ECS.addEntity(new Position(13, 37), new Name('Batman'));
        const positionEntity = ECS.addEntity(new Position(13, 37));
        const nameEntity = ECS.addEntity(new Name('Batman'));
        // when
        ECS.update();
        // then
        expect(system.entityLengthOnUpdate).eql(1);
        expect(system.entities().includes(entity)).true;
        expect(system.entities().includes(positionEntity)).false;
        expect(system.entities().includes(nameEntity)).false;
    });

    it('should add entity with position and name component to name system', () => {
        // given
        const system = new NameSystem();
        ECS.addSystem(system);
        const entity = ECS.addEntity(new Position(13, 37), new Name('Batman'));
        const positionEntity = ECS.addEntity(new Position(13, 37));
        const nameEntity = ECS.addEntity(new Name('Batman'));
        // when
        ECS.update();
        // then
        expect(system.entities().includes(entity)).eql(true, 'entity with position and name should be in system');
        expect(system.entities().includes(positionEntity)).eql(false, 'entity with position should not be in system');
        expect(system.entities().includes(nameEntity)).eql(true, 'entity with name should be in system');
    });

    it('should call onEntityAdded if a entity gets added to the system', () => {
        // given
        const system = new TestSystem();
        ECS.addSystem(system);
        // when
        const entity = ECS.addEntity(new Position(13, 37), new Name('Batman'));
        ECS.update();
        // then
        expect(system.entitiesAdded.includes(entity)).true;
    });

    it('should call onEntityAdded if a component needed by the system get added to the entity', () => {
        // given
        const system = new TestSystem();
        ECS.addSystem(system);
        const entity = ECS.addEntity(new Position(13, 37));
        ECS.update();
        expect(system.entitiesAdded.includes(entity)).false;
        entity.add(new Name('Batman'));
        // when
        ECS.update();
        // then
        expect(system.entitiesAdded.includes(entity)).true;
    });

    it('should call onEntityRemoved if a entity removes a component needed by the system', () => {
        // given
        const system = new TestSystem();
        ECS.addSystem(system);
        const entity = ECS.addEntity(new Position(13, 37), new Name('Batman'));
        ECS.update();
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
        const entity = ECS.addEntity(new Position(13, 37), new Name('Batman'));
        ECS.update();
        entity.dispose();
        // when
        ECS.update();
        // then
        expect(system.entitiesRemoved.includes(entity)).true;
    });
});
