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
let SystemThree = class SystemThree {
    update() {
        for (let i = 0, entity; entity = this.entities[i]; i++) {
            entity.get(PositionComponent).x = 1337;
            entity.get(PositionComponent).y = 1337;
        }
    }
    init() { }
};
SystemThree = __decorate([
    ECS_1.ECS.System(PositionComponent)
], SystemThree);
describe('SystemPerformance', function () {
    var systemOne;
    var systemTwo;
    var systemThree;
    this.timeout(0);
    beforeEach(() => {
        systemOne = ECS_1.ECS.addSystem(new System({ x: 0, y: 0 }));
        systemTwo = ECS_1.ECS.addSystem(new SystemTwo());
        systemThree = ECS_1.ECS.addSystem(new SystemThree());
    });
    afterEach(() => {
        systemOne.dispose();
        systemTwo.dispose();
        systemThree.dispose();
    });
    describe('#update', () => {
        it('Checks time of update for a lot of entities 10k', () => {
            for (let i = 0; i < 10000; i++) {
                let entity = ECS_1.ECS.createEntity();
                entity.add(new PositionComponent({ x: 0, y: 0 }));
                ECS_1.ECS.addEntity(entity);
            }
            const NS_PER_SEC = 1e9;
            const time = process.hrtime();
            ECS_1.ECS.update();
            const diff = process.hrtime(time);
            console.log('ECS#UpdateTime: ' + ((diff[0] * NS_PER_SEC + diff[1])) / 1000000 + " milliseconds");
        });
    });
    describe('#createEntities', () => {
        it('entities#not_pooled#10k', () => {
            const NS_PER_SEC = 1e9;
            const time = process.hrtime();
            for (let i = 0; i < 10000; i++) {
                let entity = ECS_1.ECS.createEntity();
                entity.add(new PositionComponent({ x: 0, y: 0 }));
                ECS_1.ECS.addEntity(entity);
            }
            const diff = process.hrtime(time);
            console.log('ECS#CreateNotPooled: ' + ((diff[0] * NS_PER_SEC + diff[1])) / 1000000 + " milliseconds");
        });
        it('entities#pooled#10k', () => {
            for (let i = 0; i < 10000; i++) {
                let entity = ECS_1.ECS.createEntity();
                entity.add(new PositionComponent({ x: 0, y: 0 }));
                ECS_1.ECS.addEntity(entity);
                entity.dispose();
            }
            const NS_PER_SEC = 1e9;
            const time = process.hrtime();
            for (let i = 0; i < 10000; i++) {
                let entity = ECS_1.ECS.createEntity();
                entity.add(new PositionComponent({ x: 0, y: 0 }));
                ECS_1.ECS.addEntity(entity);
            }
            const diff = process.hrtime(time);
            console.log('ECS#CreatePooled: ' + ((diff[0] * NS_PER_SEC + diff[1])) / 1000000 + " milliseconds");
        });
    });
});
