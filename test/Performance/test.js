"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
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
        const entities = this.entities;
        for (let i = 0, entity; entity = entities[i]; i++) {
            entity.components.PositionComponent.x = 42;
            entity.components.PositionComponent.y = 42;
        }
    }
};
System = __decorate([
    ECS_1.ECS.System(PositionComponent)
], System);
let SystemTwo = class SystemTwo {
    update() {
        const entities = this.entities;
        for (let i = 0, entity; entity = entities[i]; i++) {
            entity.components.PositionComponent.x = 12;
            entity.components.PositionComponent.y = 12;
        }
    }
    init() { }
};
SystemTwo = __decorate([
    ECS_1.ECS.System(PositionComponent)
], SystemTwo);
let SystemThree = class SystemThree {
    update() {
        const entities = this.entities;
        for (let i = 0, entity; entity = entities[i]; i++) {
            entity.components.PositionComponent.x = 1337;
            entity.components.PositionComponent.y = 1337;
        }
    }
    init() { }
};
SystemThree = __decorate([
    ECS_1.ECS.System(PositionComponent)
], SystemThree);
describe('SystemPerformance', function () {
    let systemOne;
    let systemTwo;
    let systemThree;
    this.timeout(0);
    beforeEach(() => {
        systemOne = ECS_1.ECS.addSystem(new System({ x: 0, y: 0 }));
        systemTwo = ECS_1.ECS.addSystem(new SystemTwo());
        systemThree = ECS_1.ECS.addSystem(new SystemThree());
        for (let i = 0; i < 10000; i++) {
            let entity = ECS_1.ECS.createEntity();
            entity.add(new PositionComponent({ x: 0, y: 0 }));
            ECS_1.ECS.addEntity(entity);
        }
    });
    afterEach(() => {
        systemOne.dispose();
        systemTwo.dispose();
        systemThree.dispose();
        ECS_1.ECS.removeAllEntities();
    });
    describe('#update', () => {
        it('Checks time of update for 10000 entities and 3 systems', () => {
            console.time('ECS#Update');
            ECS_1.ECS.update();
            console.timeEnd('ECS#Update');
        });
        it('Checks time to add 10000 entities', () => {
            ECS_1.ECS.removeAllEntities();
            console.time('ECS#AddEntities');
            for (let i = 0; i < 10000; i++) {
                let entity = ECS_1.ECS.createEntity();
                entity.add(new PositionComponent({ x: 0, y: 0 }));
                ECS_1.ECS.addEntity(entity);
            }
            console.timeEnd('ECS#AddEntities');
        });
    });
});
