import * as chai from "chai";
import {ECS} from "../../lib/ECS";
import {IEntity} from "../../lib/Entity";
import {ISystem} from "../../lib/System";
import {IComponent} from "../../lib/Component";

@ECS.Component('NameComponent')
class NameComponent implements IComponent {
    private _name:string;

    constructor(config:{ name:string } = {name:""}) {
        this.init(config);
    }

    init(config:{ name:string } = {name:""}):void {
        this._name = config.name;
    }

    remove():void {
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

@ECS.Component('NameComponent')
class ExtendedNameComponent extends NameComponent implements IComponent {
    public nameTwo:string;

    constructor(config:{name:string,nameTwo:string}={name:"",nameTwo:""}){
        super(config);
        this.init(config);
    }

    init(config:{name:string,nameTwo:string}={name:"",nameTwo:""}):void {
        this.name = config.name;
        this.nameTwo = config.nameTwo;
    }

    remove():void {
    }
}

@ECS.Component()
class PositionComponent {
    public x;
    public y;

    constructor(config:{ x:number, y:number } = {x:0, y:0}) {
        this.init(config);
    }

    init(config:{ x:number, y:number } = {x:0, y:0}):void {
        this.x = config.x;
        this.y = config.y;
    }

    remove():void {
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

@ECS.Entity(
    {component:ExtendedNameComponent, config:{name:'Normal',nameTwo:'Extended'}},
    {component: PositionComponent, config:{x:42,y:12}}
)
class ExtendedEntity {}

@ECS.System(PositionComponent)
class PositionSystem implements ISystem {
    entities:Array<IEntity>;

    constructor() {
    }
}

@ECS.System(PositionComponent, NameComponent)
class FullSystem implements ISystem {
    entities:Array<IEntity>;

    update() {
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(NameComponent).name = "CHANGED_NAME";
        }
    }

    init():void {
    }
}

@ECS.System(NameComponent)
class NameSystem implements ISystem {

    entities:Array<IEntity>;

    postUpdate() {
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(NameComponent).name = "NAME_COMP";
        }
    }
}

describe('System_Entity', function () {
    var positionSystem:ISystem;
    var nameSystem:ISystem;
    var fullSystem:ISystem;
    this.timeout(0);

    beforeEach(() => {
        ECS.systemUpdateMethods = ['update','postUpdate'];
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
            chai.expect(entity.get(NameComponent).name).to.equal("NAME_COMP");
        });
    });

    describe('#callSystemUpdateMethod', () => {
        it('Calls ECS update method which calls update method of all systems', () => {
            let entity:IEntity = ECS.addEntity(new FullEntity());
            chai.expect(entity.get(NameComponent).name).to.equal("FullEntity");
            ECS.callSystemMethod('update');
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
            ECS.bind(component,'name').on('set',component.changeNameToPROPS,component);
            component.name = 'TEST';
            chai.expect(component.name).to.equal('PROPS');
        });
    });

    describe('#unbind', () => {
        it('Bind the NameComponents name and unbind it', () => {
            let entity:IEntity = ECS.addEntity(new FullEntity());
            let component = entity.get(NameComponent);
            //Kinda stupid test :D
            ECS.bind(component,'name').on('set',component.changeNameToPROPS,component);
            ECS.unbind(component);
            component.name = 'TEST';
            chai.expect(component.name).to.equal('TEST');
        });
    });

    describe('#extendedComponent',()=>{
        it('Add entity with an ExtendedNameComponent and an entity with NameComponent, both should be handled by the same system',()=>{
            let fEntity:IEntity = ECS.addEntity(new FullEntity());
            let eEntity:IEntity = ECS.addEntity(new ExtendedEntity());
            chai.expect(eEntity.get<ExtendedNameComponent>('NameComponent').name).to.equal('Normal');
            chai.expect(eEntity.get<ExtendedNameComponent>('NameComponent').nameTwo).to.equal('Extended');
            chai.expect(fEntity.get<ExtendedNameComponent>('NameComponent').nameTwo).to.be.undefined;
            chai.expect(fEntity.get<NameComponent>(NameComponent).name).to.be.equal('FullEntity');
            chai.expect(nameSystem.has(fEntity)).to.be.true;
            chai.expect(nameSystem.has(eEntity)).to.be.true;
        });
    })
});