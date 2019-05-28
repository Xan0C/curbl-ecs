import {expect} from "chai";
import {ECS, IComponent, IEntity} from "../../src";

@ECS.Component()
class NameComponent implements IComponent {
    public name: string;

    constructor(config: { name: string } = {name: ""}) {
        this.init(config);
    }

    init(config: { name: string } = {name: ""}): void {
        this.name = config.name;
    }

    remove(): void {
    }
}

@ECS.Component()
class PositionComponent implements IComponent {
    public x;
    public y;

    constructor(config: { x: number; y: number } = {x: 0, y: 0}) {
        this.x = config.x;
        this.y = config.y;
    }

    init(config: { x: number; y: number } = {x: 0, y: 0}): void {
        this.x = config.x;
        this.y = config.y;
    }

    remove(): void {
    }

}

@ECS.Entity(
    {component: NameComponent, config: {name: "EntityTest"}}
)
class Entity implements IEntity {
    readonly id: string;

    public x;
    public y;

    constructor(config: { x: number; y: number }) {
        this.x = config.x;
        this.y = config.y;
    }
}

describe('EntityDecorator', function () {
    let entity: IEntity;
    this.timeout(0);

    beforeEach(() => {
        entity = ECS.addEntity(new Entity({x: 42, y: 12}));
    });

    afterEach(() => {
        entity.dispose();
    });

    describe('#id', () => {
        it('Checks that the entity constructor is properly called', () => {
            expect(entity["x"]).to.equal(42, 'Expected entity.x to equal 42');
            expect(entity["y"]).to.equal(12, 'Expected entity.y to equal 12');
        });
    });

    describe('#add', () => {
        it('Adds a PositionComponent to the Entity', () => {
            expect(entity.has(PositionComponent)).to.equal(false);
            let comp = new PositionComponent({x: 42, y: 12});
            entity.add(comp);
            expect(entity.has(PositionComponent)).to.equal(true);
        })
    });

    describe('#get', () => {
        it('Adds PositionComponent and expects it to get returned by the get method', () => {
            expect(entity.get(PositionComponent)).to.equal(undefined);
            let comp = new PositionComponent({x: 42, y: 12});
            entity.add(comp);
            expect(entity.get(PositionComponent)).to.equal(comp);
        });
    });

    describe('#has', () => {
        it('Adds PositionComponent and expects it has to return true', () => {
            let comp = new PositionComponent({x: 42, y: 12});
            entity.add(comp);
            expect(entity.has(PositionComponent)).to.equal(true);
        });
    });

    describe('#remove', () => {
        it('Adds Position component and call remove to be true', () => {
            let comp = new PositionComponent({x: 42, y: 12});
            entity.add(comp);
            expect(entity.remove(PositionComponent)).to.equal(true);
            expect(entity.has(PositionComponent)).to.equal(false);
        });
    });

    describe('#dispose', () => {
        it('Disposed the Entity and removes it from the ECS but keeps the Entities Components', () => {
            expect(ECS.hasEntity(entity)).to.equal(true);
            entity = entity.dispose();
            expect(ECS.hasEntity(entity)).to.equal(false);
            expect(entity.has(NameComponent)).to.equal(true);
        });

        it('Removes all entities from the ecs, but the entities keep all components', () => {
            const sEntity: IEntity = new Entity({x: 12, y: 69});
            ECS.addEntity(sEntity);
            expect(entity.has(NameComponent)).to.equal(true);
            expect(sEntity.has(NameComponent)).to.equal(true);
            expect(ECS.hasEntity(entity)).to.equal(true);
            expect(ECS.hasEntity(sEntity)).to.equal(true);
            ECS.removeAllEntities();
            expect(entity.has(NameComponent)).to.equal(true);
            expect(sEntity.has(NameComponent)).to.equal(true);
            expect(ECS.hasEntity(entity)).to.equal(false);
            expect(ECS.hasEntity(sEntity)).to.equal(false);
        });
    });

    describe('#getEntities', () => {
        it('get entities with the specified components', () => {
            expect(ECS.hasEntity(entity)).to.equal(true);
            entity.add(new PositionComponent());
            const sEntity = new Entity({x: 21, y: 12});
            ECS.addEntity(sEntity);
            const nameAndPosEntities: IEntity[] = ECS.getEntities(PositionComponent, NameComponent);
            expect(nameAndPosEntities.length).to.equal(1);
            expect(nameAndPosEntities[0]).to.equal(entity);

            const nameEntities: IEntity[] = ECS.getEntities(NameComponent);
            expect(nameEntities.length).to.equal(2);
            expect(nameEntities[0]).to.equal(entity);
            expect(nameEntities[1]).to.equal(sEntity);
        });
    });
});