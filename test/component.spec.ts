import { expect } from 'chai';
import { ECS as ecs } from '../src';

const ECS = new ecs();

@ECS.Component('TestComponent')
class TestComponent {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

@ECS.Component('TestComponentExtended')
class TestComponentExtended extends TestComponent {
    value: number;

    constructor(name: string) {
        super(name);
        this.value = 4711;
    }
}

describe('Component', function () {
    after(() => {
        ECS.reset();
    });

    describe('#decorator', () => {
        it('should set __id for the component', () => {
            const component = new TestComponent('TestComponent');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__id).eql('TestComponent');
            expect(component.name).eql('TestComponent');
        });

        it('inheritance should work with component decorator', () => {
            const component = new TestComponentExtended('TestComponent');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__id).eql('TestComponentExtended');
            expect(component.name).eql('TestComponent');
            expect(component.value).eql(4711);
        });
    });
});
