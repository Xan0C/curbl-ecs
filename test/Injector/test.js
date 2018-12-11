"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by Soeren on 26.10.2017.
 */
const chai = require("chai");
const ECS_1 = require("../../lib/ECS");
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
let SystemDeux = class SystemDeux {
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
SystemDeux = __decorate([
    ECS_1.ECS.System(PositionComponent)
], SystemDeux);
let Injected = class Injected {
    constructor() {
    }
};
Injected = __decorate([
    ECS_1.ECS.Injector.System({
        system: System
    })
], Injected);
describe('SystemDecorator', function () {
    var system;
    this.timeout(0);
    beforeEach(() => {
        system = ECS_1.ECS.addSystem(new System({ x: 42, y: 12 }));
    });
    afterEach(() => {
        system.dispose();
    });
    describe('#inject', () => {
        it('#System#Checks that the system got injected as a property', () => {
            let injected = new Injected();
            chai.expect(injected.system).to.equal(ECS_1.ECS.getSystem(System));
        });
    });
});
