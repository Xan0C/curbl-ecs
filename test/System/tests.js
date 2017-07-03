"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const ECS_1 = require("../../lib/ECS");
/**
 * Created by Soeren on 29.06.2017.
 */
class PositionComponent {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
    }
}
exports.PositionComponent = PositionComponent;
let System = class System {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
    }
};
System = __decorate([
    ECS_1.ECS.System(PositionComponent)
], System);
describe('SystemDecorator', function () {
    var system;
    this.timeout(0);
    beforeEach(() => {
        system = new System({ x: 42, y: 12 });
    });
    afterEach(() => {
        system.dispose();
    });
    describe('#entities', () => {
        it('Checks that a entities property descriptor got created', () => {
            chai.expect(system.entities).to.not.equal(undefined);
        });
    });
    describe('#componentMask', () => {
        it('Checks that the componentMask properties descriptor got created for the system', () => {
            chai.expect(system.componentMask).to.equal(ECS_1.ECS.getSystemComponentMask(system));
            chai.expect(system.componentMask).to.not.equal(0);
        });
    });
    describe('#has', () => {
        it('Checks if the Entity is in the system', () => {
        });
    });
    describe('#remove', () => {
        it('Removes an Entity from the System, or from all systems', () => {
        });
    });
    describe('#dispose', () => {
        it('Disposed the System and removes it from the ECS', () => {
            chai.expect(ECS_1.ECS.hasSystem(system)).to.equal(true);
            system.dispose();
            chai.expect(ECS_1.ECS.hasSystem(system)).to.equal(false);
        });
    });
});
describe('ECS_System_Functions', function () {
    this.timeout(0);
    beforeEach(() => {
    });
    afterEach(() => {
    });
});
