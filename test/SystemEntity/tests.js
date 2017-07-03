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
let NameEntity = class NameEntity {
};
NameEntity = __decorate([
    ECS_1.ECS.Entity({ component: NameComponent, config: { name: "EntityTest" } })
], NameEntity);
let PositionEntity = class PositionEntity {
};
PositionEntity = __decorate([
    ECS_1.ECS.Entity({ component: PositionComponent, config: { x: 42, y: 42 } })
], PositionEntity);
let FullEntity = class FullEntity {
};
FullEntity = __decorate([
    ECS_1.ECS.Entity({ component: NameComponent, config: { name: "FullEntity" } }, { component: PositionComponent, config: { x: 42, y: 12 } })
], FullEntity);
let PositionSystem = class PositionSystem {
    constructor() {
    }
};
PositionSystem = __decorate([
    ECS_1.ECS.System(PositionComponent)
], PositionSystem);
let NameSystem = class NameSystem {
    postUpdate() {
        for (let entity of this.entities.values()) {
            entity.get(NameComponent).name = "NAME_COMP";
        }
    }
};
NameSystem = __decorate([
    ECS_1.ECS.System(NameComponent)
], NameSystem);
let FullSystem = class FullSystem {
    update(entities) {
        for (let entity of entities.values()) {
            entity.get(NameComponent).name = "CHANGED_NAME";
        }
    }
};
FullSystem = __decorate([
    ECS_1.ECS.System(PositionComponent, NameComponent)
], FullSystem);
describe('System_Entity', function () {
    var positionSystem;
    var nameSystem;
    var fullSystem;
    this.timeout(0);
    beforeEach(() => {
        positionSystem = new PositionSystem();
        nameSystem = new NameSystem();
        fullSystem = new FullSystem();
    });
    afterEach(() => {
        positionSystem.dispose();
        nameSystem.dispose();
        fullSystem.dispose();
    });
    describe('#CreateEntities', () => {
        it('Creates PositionEntity and checks if its added to the right System', () => {
            let entity = new PositionEntity();
            chai.expect(positionSystem.has(entity)).to.equal(true);
            chai.expect(nameSystem.has(entity)).to.equal(false);
            chai.expect(fullSystem.has(entity)).to.equal(false);
            entity.dispose();
            chai.expect(positionSystem.has(entity)).to.equal(false);
        });
        it('Creates a NameEntity and checks if its added to the right System', () => {
            let entity = new NameEntity();
            chai.expect(positionSystem.has(entity)).to.equal(false);
            chai.expect(nameSystem.has(entity)).to.equal(true);
            chai.expect(fullSystem.has(entity)).to.equal(false);
            entity.dispose();
            chai.expect(nameSystem.has(entity)).to.equal(false);
        });
        it('Creates a FullEntity and checks if its added to the right Systems', () => {
            let entity = new FullEntity();
            chai.expect(positionSystem.has(entity)).to.equal(true);
            chai.expect(nameSystem.has(entity)).to.equal(true);
            chai.expect(fullSystem.has(entity)).to.equal(true);
            entity.dispose();
            chai.expect(positionSystem.has(entity)).to.equal(false);
            chai.expect(nameSystem.has(entity)).to.equal(false);
            chai.expect(fullSystem.has(entity)).to.equal(false);
        });
    });
    describe('#addComponent', () => {
        it('Adds a NameComponent to the PositionEntity and checks if its added to the right Systems', () => {
            let entity = new PositionEntity();
            chai.expect(positionSystem.has(entity)).to.equal(true);
            chai.expect(nameSystem.has(entity)).to.equal(false);
            chai.expect(fullSystem.has(entity)).to.equal(false);
            entity.add(new NameComponent());
            chai.expect(positionSystem.has(entity)).to.equal(true);
            chai.expect(nameSystem.has(entity)).to.equal(true);
            chai.expect(fullSystem.has(entity)).to.equal(true);
        });
    });
    describe('#removeComponent', () => {
        it('Removes a NameComponent from the FullEntity and checks if its removed from the Systems', () => {
            let entity = new FullEntity();
            chai.expect(positionSystem.has(entity)).to.equal(true);
            chai.expect(nameSystem.has(entity)).to.equal(true);
            chai.expect(fullSystem.has(entity)).to.equal(true);
            entity.remove(NameComponent);
            chai.expect(positionSystem.has(entity)).to.equal(true);
            chai.expect(nameSystem.has(entity)).to.equal(false);
            chai.expect(fullSystem.has(entity)).to.equal(false);
        });
    });
    describe('#systemUpdateMethods', () => {
        it('Calls ECS update method which calls update method of all systems', () => {
            let entity = new FullEntity();
            chai.expect(entity.get(NameComponent).name).to.equal("FullEntity");
            ECS_1.ECS.update();
            chai.expect(entity.get(NameComponent).name).to.equal("CHANGED_NAME");
        });
    });
    describe('#callSystemUpdateMethod', () => {
        it('Calls ECS update method which calls update method of all systems', () => {
            let entity = new FullEntity();
            ECS_1.ECS.systemUpdateMethods = ["update", "postUpdate"];
            chai.expect(entity.get(NameComponent).name).to.equal("FullEntity");
            ECS_1.ECS.callSystemMethod("update");
            chai.expect(entity.get(NameComponent).name).to.equal("CHANGED_NAME");
            ECS_1.ECS.update();
            chai.expect(entity.get(NameComponent).name).to.equal("NAME_COMP");
        });
    });
});
