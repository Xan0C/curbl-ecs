import * as chai from "chai";
import {Inject} from "../../lib/decorator/MetaDecorator";

class Position {
    x:number;
    y:number;

    constructor(x:number,y:number){
        this.x = x;
        this.y = y;
    }
}

class Test {
    @Inject(Position,5,10)
    public position:Position;
}

describe('MetaDecorator', function() {
    this.timeout(0);

    beforeEach(() => {

    });

    afterEach(() => {

    });

    describe('#Inject', () => {
        it('Inject class of the type together with the Arguments into the property', () => {
            let test = new Test();
            chai.expect(test.position.x).to.equal(5,'Expected position.x to equal 5');
            chai.expect(test.position.y).to.equal(10,'Expected position.y to equal 10');
        });
    });

});