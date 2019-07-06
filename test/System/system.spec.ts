import {ECS, IComponent, IEntity, ISystem} from "../../src";
import {expect} from "chai";

@ECS.Component()
export class PositionComponent implements IComponent {

    public x;
    public y;

    constructor(config: { x: number; y: number }) {
        this.init(config);
    }

    init(config: { x: number; y: number }): void {
        this.x = config.x;
        this.y = config.y;
    }

    remove(): void {
    }
}

@ECS.System(PositionComponent)
class System {
    entities: IEntity[];
    public x;
    public y;

    constructor(config: { x: number; y: number }) {
        this.x = config.x;
        this.y = config.y;
    }

    update(): void {
        for (let i = 0, entity; entity = this.entities[i]; i++) {
            entity.get(PositionComponent).x = 42;
            entity.get(PositionComponent).y = 42;
        }
    }
}

@ECS.System(PositionComponent)
class SystemTwo implements ISystem {
    entities: IEntity[];

    update(): void {
        for (let i = 0, entity; entity = this.entities[i]; i++) {
            entity.get(PositionComponent).x = 12;
            entity.get(PositionComponent).y = 12;
        }
    }
}

@ECS.System()
class EmptySystem implements ISystem {
    entities: IEntity[];

    update(): void {
    }
}

@ECS.System()
class ArgumentSystem implements ISystem {
    entities: IEntity[];
    name: string;

    update(name: string): void {
        this.name = name;
    }
}

@ECS.System()
class SetupAndTearDownSystem implements ISystem {
    public setUpCalled: boolean;
    public tearDownCalled: boolean;

    setUp(): void {
        this.setUpCalled = true;
    }

    tearDown(): void {
        this.tearDownCalled = true;
    }
}

describe('SystemDecorator', function () {
    var system: ISystem;
    this.timeout(0);

    beforeEach(() => {
        system = ECS.addSystem(new System({x: 42, y: 12}));
    });

    afterEach(() => {
        system.dispose();
    });

    describe('#setUp', () => {
        it('Checks that the setUp method gets invoked after the System is added to the ECS', () => {
            const system = new SetupAndTearDownSystem();
            ECS.addSystem(system);
            expect(system.setUpCalled).to.equal(true);
        });
    });

    describe('#tearDown', () => {
        it('Checks that the tearDown method gets invoked after the System is removed from the ECS', () => {
            const system = new SetupAndTearDownSystem();
            ECS.addSystem(system);
            ECS.removeSystem(system);
            expect(system.tearDownCalled).to.equal(true);
        });
    });

    describe('#entities', () => {
        it('Checks that a entities property descriptor got created', () => {
            expect(system.entities).to.not.equal(undefined);
        });
    });

    describe('#componentMask', () => {
        it('Checks that the componentMask properties descriptor got created for the system', () => {
            expect(system.bitmask).to.not.equal(0);
        });
    });

    describe('#has', () => {
        it('Checks if the Entity is in the system', () => {
            let entity = ECS.createEntity();
            entity.add(new PositionComponent({x: 0, y: 0}));
            expect(system.has(entity)).to.equal(false);
            ECS.addEntity(entity);
            expect(system.has(entity)).to.equal(true);
        });
    });

    describe('#remove', () => {
        it('Removes an Entity from ECS and from all systems', () => {
            let entity = ECS.createEntity();
            entity.add(new PositionComponent({x: 0, y: 0}));
            expect(system.has(entity)).to.equal(false);
            ECS.addEntity(entity);
            expect(system.has(entity)).to.equal(true);
            system.remove(entity);
            expect(system.has(entity)).to.equal(false);
        });

        it('Removes an Entity from the System but not from the ECS', () => {
            let scdSystem: ISystem = new SystemTwo();
            ECS.addSystem(scdSystem);
            let entity = ECS.createEntity();
            entity.add(new PositionComponent({x: 0, y: 0}));
            expect(system.has(entity)).to.equal(false);
            expect(scdSystem.has(entity)).to.equal(false);
            ECS.addEntity(entity);
            expect(system.has(entity)).to.equal(true);
            expect(scdSystem.has(entity)).to.equal(true);
            system.remove(entity, false);
            expect(system.has(entity)).to.equal(false);
            expect(scdSystem.has(entity)).to.equal(true);
            scdSystem.dispose();
        });
    });

    describe('#dispose', () => {
        it('Disposed the System and removes it from the ECS', () => {
            expect(ECS.hasSystem(system)).to.equal(true);
            system.dispose();
            expect(ECS.hasSystem(system)).to.equal(false);
        });
    });

    describe('#EmptySystem', () => {
        it('Add a System without a component mask and checks that no entity is added to the System', () => {
            const system = ECS.addSystem(new EmptySystem());
            const entity = ECS.createEntity();
            entity.add(new PositionComponent({x: 0, y: 0}));
            ECS.addEntity(entity);
            expect(system.entities.indexOf(entity)).to.equal(-1);
        });
    });

    describe('#ArgumentsUpdate', () => {
        it('Adds parameter arguments to the systems/ecs update function', () => {
            const system = ECS.addSystem(new ArgumentSystem());
            ECS.update("ArgumentSystemTest");
            expect(system.name).to.equal("ArgumentSystemTest");
        });
    })
});