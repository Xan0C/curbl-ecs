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
class NameComponent {
    constructor(config = { name: "" }) {
        this.name = config.name;
    }
}
class PositionComponent {
    constructor(config = { x: 0, y: 0 }) {
        this.x = config.x;
        this.y = config.y;
    }
}
let Entity = class Entity {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
    }
};
Entity = __decorate([
    ECS_1.ECS.Entity({ component: NameComponent, config: { name: "EntityTest" } })
], Entity);
describe('EntityDecorator', function () {
    var entity;
    this.timeout(0);
    beforeEach(() => {
        entity = ECS_1.ECS.addEntity(new Entity({ x: 42, y: 12 }));
    });
    afterEach(() => {
        entity.dispose(true);
    });
    describe('#id', () => {
        it('Checks that a id got injected into the entity', () => {
            chai.expect(entity["x"]).to.equal(42, 'Expected entity.x to equal 42');
            chai.expect(entity["y"]).to.equal(12, 'Expected entity.y to equal 12');
        });
    });
    describe('#add', () => {
        it('Adds a PositionComponent to the Entity', () => {
            chai.expect(entity.has(PositionComponent)).to.equal(false);
            let comp = new PositionComponent({ x: 42, y: 12 });
            entity.add(comp);
            chai.expect(entity.has(PositionComponent)).to.equal(true);
        });
    });
    describe('#get', () => {
        it('Adds PositionComponent and expects it to get returned by the get method', () => {
            chai.expect(entity.get(PositionComponent)).to.equal(undefined);
            let comp = new PositionComponent({ x: 42, y: 12 });
            entity.add(comp);
            chai.expect(entity.get(PositionComponent)).to.equal(comp);
        });
    });
    describe('#has', () => {
        it('Adds PositionComponent and expects it has to return true', () => {
            let comp = new PositionComponent({ x: 42, y: 12 });
            entity.add(comp);
            chai.expect(entity.has(PositionComponent)).to.equal(true);
        });
    });
    describe('#remove', () => {
        it('Adds Position component and call remove to be true', () => {
            let comp = new PositionComponent({ x: 42, y: 12 });
            entity.add(comp);
            chai.expect(entity.remove(PositionComponent)).to.equal(true);
            chai.expect(entity.has(PositionComponent)).to.equal(false);
        });
    });
    describe('#dispose', () => {
        it('Disposed the Entity and removes it from the ECS', () => {
            chai.expect(ECS_1.ECS.hasEntity(entity)).to.equal(true);
            entity.dispose(true);
            chai.expect(ECS_1.ECS.hasEntity(entity)).to.equal(false);
        });
    });
});
