import { expect } from 'chai';
import { ECS as ecs } from '../src';

const ECS = new ecs();

@ECS.Component('shape')
class Shape {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

@ECS.Component('quad')
class Quad extends Shape {
    size: number;

    constructor(name: string, size: number) {
        super(name);
        this.size = size;
    }
}

@ECS.Component('position')
class Position {
    x = 0;
    y = 0;
}

describe('Component', function () {
    after(() => {
        ECS.reset();
    });

    describe('#decorator', () => {
        it('should set __id and __bit for the component', () => {
            const component = new Shape('shape');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__id).eql('shape');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__bit).eql(0);
            expect(component.name).eql('shape');
        });

        it('inheritance should work with component decorator', () => {
            const component = new Quad('quad', 4711);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__id).eql('quad');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__bit).eql(1);
            expect(component.name).eql('quad');
            expect(component.size).eql(4711);
        });

        it('should set bit for component', () => {
            const position = new Position();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(position.constructor.__bit).eql(2);
        });
    });
});
