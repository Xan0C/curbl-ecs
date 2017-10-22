import * as chai from "chai";
import {IEntity} from "../../lib/Entity";
import {ECS} from "../../lib/ECS";
import {ISystem} from "../../lib/System";
import {IComponent} from "../../src/Component";
/**
 * Created by Soeren on 29.06.2017.
 */

@ECS.Component()
export class PositionComponent implements IComponent {

    public x;
    public y;

    constructor(config:{x:number,y:number}){
        this.init(config);
    }

    init(config:{x:number,y:number}):void {
        this.x = config.x;
        this.y = config.y;
    }

    remove():void {
    }
}

@ECS.System(PositionComponent)
class System implements ISystem {
    entities:Array<IEntity>;
    public x;
    public y;

    constructor(config:{x:number,y:number}){
        this.x = config.x;
        this.y = config.y;
    }

    update():void{
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(PositionComponent).x = 42;
            entity.get(PositionComponent).y = 42;
        }
    }
}

@ECS.System(PositionComponent)
class SystemTwo implements ISystem {
    entities:Array<IEntity>;
    public mockValue:string;

    update():void{
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(PositionComponent).x = 12;
            entity.get(PositionComponent).y = 12;
        }
    }

    init():void{}
}

@ECS.System(PositionComponent)
class Subsystem implements ISystem {
    entities:Array<IEntity>;

    update():void{
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(PositionComponent).x = 1337;
            entity.get(PositionComponent).y = 1337;
        }
    }

    init():void{}
}

describe('SystemDecorator', function() {
    var system:ISystem;
    this.timeout(0);

    beforeEach(() => {
        system = ECS.addSystem(new System({x:42,y:12}));
    });

    afterEach(() => {
        system.dispose();
    });

    describe('#entities', () => {
        it('Checks that a entities property descriptor got created', () => {
            chai.expect(system.entities).to.not.equal(undefined);
        });
    });

    describe('#componentMask', ()=> {
        it('Checks that the componentMask properties descriptor got created for the system',()=> {
            chai.expect(system.bitmask).to.not.equal(0);
        });
    });

    describe('#has',()=>{
        it('Checks if the Entity is in the system',()=> {
            let entity = ECS.createEntity();
            entity.add(new PositionComponent({x:0,y:0}));
            chai.expect(system.has(entity)).to.equal(false);
            ECS.addEntity(entity);
            chai.expect(system.has(entity)).to.equal(true);
        });
    });

    describe('#remove', ()=>{
        it('Removes an Entity from ECS and from all systems',()=> {
            let entity = ECS.createEntity();
            entity.add(new PositionComponent({x:0,y:0}));
            chai.expect(system.has(entity)).to.equal(false);
            ECS.addEntity(entity);
            chai.expect(system.has(entity)).to.equal(true);
            system.remove(entity);
            chai.expect(system.has(entity)).to.equal(false);
        });

        it('Removes an Entity from the System but not from the ECS',()=> {
            let scdSystem:ISystem = new SystemTwo();
            ECS.addSystem(scdSystem);
            let entity = ECS.createEntity();
            entity.add(new PositionComponent({x:0,y:0}));
            chai.expect(system.has(entity)).to.equal(false);
            chai.expect(scdSystem.has(entity)).to.equal(false);
            ECS.addEntity(entity);
            chai.expect(system.has(entity)).to.equal(true);
            chai.expect(scdSystem.has(entity)).to.equal(true);
            system.remove(entity,false);
            chai.expect(system.has(entity)).to.equal(false);
            chai.expect(scdSystem.has(entity)).to.equal(true);
            scdSystem.dispose();
        });
    });

    describe('#dispose',()=>{
        it('Disposed the System and removes it from the ECS',()=>{
            chai.expect(ECS.hasSystem(system)).to.equal(true);
            system.dispose();
            chai.expect(ECS.hasSystem(system)).to.equal(false);
        });
    })
});