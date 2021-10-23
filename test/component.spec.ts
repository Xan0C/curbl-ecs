import { expect } from 'chai';
import { ECS as ecs } from '../src';

const ECS = new ecs();

@ECS.Component('TestComponent', (name: string) => new TestComponent(name))
class TestComponent {
    name: string;
    initCalled = false;

    constructor(name: string) {
        this.name = name;
    }

    init(name: string): void {
        this.name = name;
        this.initCalled = true;
    }
}

@ECS.Component('TestComponentExtended', (name: string) => new TestComponentExtended(name))
class TestComponentExtended extends TestComponent {
    value: number;
    initExtendedCalled = false;

    constructor(name: string) {
        super(name);
        this.value = 4711;
    }

    override init(name: string): void {
        super.init(name);
        this.initExtendedCalled = true;
    }
}

describe('Component', function () {
    after(() => {
        ECS.reset(true);
    });

    describe('#decorator', () => {
        it('should set __id for the component', () => {
            const component = new TestComponent('TestComponent');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.__id).eql('TestComponent');
            expect(component.name).eql('TestComponent');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.init).not.undefined;
        });

        it('inheritance should work with component decorator', () => {
            const component = new TestComponentExtended('TestComponent');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.__id).eql('TestComponentExtended');
            expect(component.name).eql('TestComponent');
            expect(component.value).eql(4711);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.init).not.undefined;
        });

        it('should register component and create via factory method', () => {
            ECS.__removeComponent(new TestComponentExtended(''));
            const component = ECS.createComponent<TestComponentExtended>('TestComponentExtended', 'Test');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.__id).eql('TestComponentExtended');
            expect(component.name).eql('Test');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.init).not.undefined;
            expect(component.initCalled).true;
            expect(component.initExtendedCalled).true;
        });
    });
});
