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

@ECS.Component('quad', 'shape')
class Quad extends Shape {
    size: number;

    constructor(name: string, size: number) {
        super(name);
        this.size = size;
    }
}

@ECS.Component('rectangle', 'shape')
class Rectangle extends Shape {
    width: number;
    height: number;

    constructor(name: string, width: number, height: number) {
        super(name);
        this.width = width;
        this.height = height;
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
        it('should set __id, __group and __bit for the component', () => {
            const component = new Shape('shape');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__id).eql('shape');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__bit).eql(0);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__group).eql('shape');
            expect(component.name).eql('shape');
        });

        it('inheritance should work with component decorator', () => {
            const component = new Quad('quad', 4711);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__id).eql('quad');
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__bit).eql(0);
             // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(component.constructor.__group).eql('shape');
            expect(component.name).eql('quad');
            expect(component.size).eql(4711);
        });

        it('should add components to the same group(same bit)', () => {
            const quad = new Quad('quad', 4711);
            const rectangle = new Rectangle('rect', 13, 37);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(quad.constructor.__bit).eql(0);
             // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(rectangle.constructor.__bit).eql(0);
        });

        it('should set bit for component in different group', () => {
            const position = new Position();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(position.constructor.__bit).eql(1);             
        });
    });
});
