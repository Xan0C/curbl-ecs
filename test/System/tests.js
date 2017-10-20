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
let PositionComponent = class PositionComponent {
    constructor(config) {
        this.init(config);
    }
    init(config) {
        this.x = config.x;
        this.y = config.y;
    }
    remove() {
    }
};
PositionComponent = __decorate([
    ECS_1.ECS.Component()
], PositionComponent);
exports.PositionComponent = PositionComponent;
let System = class System {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
    }
    update() {
        for (let i = 0, entity; entity = this.entities[i]; i++) {
            entity.get(PositionComponent).x = 42;
            entity.get(PositionComponent).y = 42;
        }
    }
};
System = __decorate([
    ECS_1.ECS.System(PositionComponent)
], System);
let SystemTwo = class SystemTwo {
    update() {
        for (let i = 0, entity; entity = this.entities[i]; i++) {
            entity.get(PositionComponent).x = 12;
            entity.get(PositionComponent).y = 12;
        }
    }
    init() { }
};
SystemTwo = __decorate([
    ECS_1.ECS.System(PositionComponent)
], SystemTwo);
let Subsystem = class Subsystem {
    update() {
        for (let i = 0, entity; entity = this.entities[i]; i++) {
            entity.get(PositionComponent).x = 1337;
            entity.get(PositionComponent).y = 1337;
        }
    }
    init() { }
};
Subsystem = __decorate([
    ECS_1.ECS.System(PositionComponent)
], Subsystem);
describe('SystemDecorator', function () {
    var system;
    this.timeout(0);
    beforeEach(() => {
        system = ECS_1.ECS.addSystem(new System({ x: 42, y: 12 }));
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
            chai.expect(system.bitmask).to.not.equal(0);
        });
    });
    describe('#has', () => {
        it('Checks if the Entity is in the system', () => {
            let entity = ECS_1.ECS.createEntity();
            entity.add(new PositionComponent({ x: 0, y: 0 }));
            chai.expect(system.has(entity)).to.equal(false);
            ECS_1.ECS.addEntity(entity);
            console.log(system);
            console.log(entity);
            chai.expect(system.has(entity)).to.equal(true);
        });
    });
    describe('#remove', () => {
        it('Removes an Entity from ECS and from all systems', () => {
            let entity = ECS_1.ECS.createEntity();
            entity.add(new PositionComponent({ x: 0, y: 0 }));
            chai.expect(system.has(entity)).to.equal(false);
            ECS_1.ECS.addEntity(entity);
            chai.expect(system.has(entity)).to.equal(true);
            system.remove(entity);
            chai.expect(system.has(entity)).to.equal(false);
        });
        it('Removes an Entity from the System but not from the ECS', () => {
            let scdSystem = new SystemTwo();
            ECS_1.ECS.addSystem(scdSystem);
            let entity = ECS_1.ECS.createEntity();
            entity.add(new PositionComponent({ x: 0, y: 0 }));
            chai.expect(system.has(entity)).to.equal(false);
            chai.expect(scdSystem.has(entity)).to.equal(false);
            ECS_1.ECS.addEntity(entity);
            chai.expect(system.has(entity)).to.equal(true);
            chai.expect(scdSystem.has(entity)).to.equal(true);
            system.remove(entity, false);
            chai.expect(system.has(entity)).to.equal(false);
            chai.expect(scdSystem.has(entity)).to.equal(true);
            scdSystem.dispose();
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
