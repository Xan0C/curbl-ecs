import * as chai from "chai";
import {ECS} from "../../lib/ECS";
import {IEntity} from "../../lib/Entity";
import {ISystem} from "../../lib/System";

@ECS.Component()
class NameComponent {
    private _name:string;

    constructor(config:{ name:string } = {name:""}) {
        this._name = config.name;
    }

    public changeNameToPROPS():void{
        this._name = 'PROPS';
    }

    public get name():string {
        return this._name;
    }

    public set name(value:string) {
        this._name = value;
    }
}

@ECS.Component()
class PositionComponent {
    public x;
    public y;

    constructor(config:{ x:number, y:number } = {x:0, y:0}) {
        this.x = config.x;
        this.y = config.y;
    }
}

@ECS.Entity(
    {component:NameComponent, config:{name:"EntityTest"}}
)
class NameEntity implements IEntity {
}

@ECS.Entity(
    {component:PositionComponent, config:{x:42, y:42}}
)
class PositionEntity implements IEntity {
}

@ECS.Entity(
    {component:NameComponent, config:{name:"FullEntity"}},
    {component:PositionComponent, config:{x:42, y:12}}
)
class FullEntity {
}

@ECS.System(PositionComponent)
class PositionSystem implements ISystem {
    entities:Map<string, IEntity>;
    componentMask:number;

    constructor() {
    }
}

@ECS.System(NameComponent)
class NameSystem implements ISystem {

    entities:Map<string, IEntity>;

    postUpdate() {
        for (let entity of this.entities.values()) {
            entity.get(NameComponent).name = "NAME_COMP";
        }
    }
}

@ECS.System(PositionComponent, NameComponent)
class FullSystem implements ISystem {

    update(entities:Map<string, IEntity>) {
        for (let entity of entities.values()) {
            entity.get(NameComponent).name = "CHANGED_NAME";
        }
    }

    init():void {
    }
}

describe('System_Entity', function () {
    var positionSystem:ISystem;
    var nameSystem:ISystem;
    var fullSystem:ISystem;
    this.timeout(0);

    beforeEach(() => {
        positionSystem = ECS.addSystem(new PositionSystem());
        nameSystem = ECS.addSystem(new NameSystem());
        fullSystem = ECS.addSystem(new FullSystem());
    });

    afterEach(() => {
        positionSystem.dispose();
        nameSystem.dispose();
        fullSystem.dispose();
    });

    describe('#CreateEntities', () => {
        it('Creates PositionEntity and checks if its added to the right System', () => {
            let entity:IEntity = ECS.addEntity(new PositionEntity());
            chai.expect(positionSystem.has(entity)).to.equal(true);
            chai.expect(nameSystem.has(entity)).to.equal(false);
            chai.expect(fullSystem.has(entity)).to.equal(false);
            entity.dispose();
            chai.expect(positionSystem.has(entity)).to.equal(false);
        });

        it('Creates a NameEntity and checks if its added to the right System', () => {
            let entity:IEntity = ECS.addEntity(new NameEntity());
            chai.expect(positionSystem.has(entity)).to.equal(false);
            chai.expect(nameSystem.has(entity)).to.equal(true);
            chai.expect(fullSystem.has(entity)).to.equal(false);
            entity.dispose();
            chai.expect(nameSystem.has(entity)).to.equal(false);
        });

        it('Creates a FullEntity and checks if its added to the right Systems', () => {
            let entity:IEntity = ECS.addEntity(new FullEntity());
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
            let entity:IEntity = ECS.addEntity(new PositionEntity());
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
            let entity:IEntity = ECS.addEntity(new FullEntity());
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
            let entity:IEntity = ECS.addEntity(new FullEntity());
            chai.expect(entity.get(NameComponent).name).to.equal("FullEntity");
            ECS.update();
            chai.expect(entity.get(NameComponent).name).to.equal("CHANGED_NAME");
        });
    });

    describe('#callSystemUpdateMethod', () => {
        it('Calls ECS update method which calls update method of all systems', () => {
            let entity:IEntity = ECS.addEntity(new FullEntity());
            ECS.systemUpdateMethods = ["update", "postUpdate"];
            chai.expect(entity.get(NameComponent).name).to.equal("FullEntity");
            ECS.callSystemMethod("update");
            chai.expect(entity.get(NameComponent).name).to.equal("CHANGED_NAME");
            ECS.update();
            chai.expect(entity.get(NameComponent).name).to.equal("NAME_COMP");
        });
    });

    describe('#bind', () => {
        it('Bind the NameComponents name', () => {
            let entity:IEntity = ECS.addEntity(new FullEntity());
            let component = entity.get(NameComponent);
            //Kinda stupid test :D
            ECS.bind(component,'name').onPropertySet.add('changeNameToPROPS',component);
            component.name = 'TEST';
            chai.expect(component.name).to.equal('PROPS');
        });
    });

    describe('#unbind', () => {
        it('Bind the NameComponents name and unbind it', () => {
            let entity:IEntity = ECS.addEntity(new FullEntity());
            let component = entity.get(NameComponent);
            //Kinda stupid test :D
            ECS.bind(component,'name').onPropertySet.add('changeNameToPROPS',component);
            ECS.unbind(component);
            component.name = 'TEST';
            chai.expect(component.name).to.equal('TEST');
        });
    });
});