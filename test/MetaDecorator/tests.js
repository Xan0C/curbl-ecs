"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const MetaDecorator_1 = require("../../lib/decorator/MetaDecorator");
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Test {
}
__decorate([
    MetaDecorator_1.Inject(Position, 5, 10)
], Test.prototype, "position", void 0);
describe('MetaDecorator', function () {
    this.timeout(0);
    beforeEach(() => {
    });
    afterEach(() => {
    });
    describe('#Inject', () => {
        it('Inject class of the type together with the Arguments into the property', () => {
            let test = new Test();
            chai.expect(test.position.x).to.equal(5, 'Expected position.x to equal 5');
            chai.expect(test.position.y).to.equal(10, 'Expected position.y to equal 10');
        });
    });
});
