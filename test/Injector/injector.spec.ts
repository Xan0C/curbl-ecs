import { expect } from 'chai';
import { ECS, Entity, System } from '../../src';

@ECS.Component()
export class PositionComponent {
    public x;
    public y;

    constructor(config: { x: number; y: number }) {
        this.init(config);
    }

    init(config: { x: number; y: number }): void {
        this.x = config.x;
        this.y = config.y;
    }

    remove(): void {}
}

@ECS.System(PositionComponent)
class TestSystem extends System {
    entities: Entity[];
    public x;
    public y;

    constructor(config: { x: number; y: number }) {
        super();
        this.x = config.x;
        this.y = config.y;
    }

    update(): void {
        for (let i = 0, entity; (entity = this.entities[i]); i++) {
            entity.get(PositionComponent).x = 42;
            entity.get(PositionComponent).y = 42;
        }
    }
}

@ECS.Injector.System({
    system: TestSystem,
})
class Injected {
    public system: System;

    constructor() {}
}

describe('SystemDecorator', function() {
    let system: System;
    this.timeout(0);

    beforeEach(() => {
        system = ECS.addSystem(new TestSystem({ x: 42, y: 12 }));
    });

    afterEach(() => {
        system.dispose();
    });

    describe('#inject', () => {
        it('#System#Checks that the system got injected as a property', () => {
            const injected = new Injected();
            expect(injected.system).to.equal(ECS.getSystem(TestSystem));
        });
    });
});
