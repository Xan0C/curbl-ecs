import * as chai from "chai";
import {IEntity} from "../../lib/Entity";
import {ECS} from "../../lib/ECS";
import {IComponent} from "../../lib/Component";

/**
 * Created by Soeren on 29.06.2017.
 */
@ECS.Component()
class NameComponent implements IComponent {
    public name:string;

    constructor(config:{name:string}={name:""}){
        this.init(config);
    }

    init(config:{name:string}={name:""}):void {
        this.name = config.name;
    }

    remove():void {
    }
}

@ECS.Component()
class PositionComponent implements IComponent {
    public x;
    public y;

    constructor(config:{x:number,y:number}={x:0,y:0}){
        this.x = config.x;
        this.y = config.y;
    }

    init(config:{x:number,y:number}={x:0,y:0}):void {
        this.x = config.x;
        this.y = config.y;
    }

    remove():void {
    }

}

@ECS.Entity(
    {component:NameComponent,config:{name:"EntityTest"}}
)
class Entity implements IEntity{
   readonly id:string;

   public x;
   public y;

   constructor(config:{x:number,y:number}){
        this.x = config.x;
        this.y = config.y;
   }
}

describe('EntityDecorator', function() {
    var entity:IEntity;
    this.timeout(0);

    beforeEach(() => {
        entity = ECS.addEntity(new Entity({x:42,y:12}));
    });

    afterEach(() => {
        entity.destroy(false);
    });

    describe('#id', () => {
        it('Checks that the entity constructor is properly called', () => {
            chai.expect(entity["x"]).to.equal(42,'Expected entity.x to equal 42');
            chai.expect(entity["y"]).to.equal(12,'Expected entity.y to equal 12');
        });
    });

    describe('#add', ()=>{
        it('Adds a PositionComponent to the Entity',()=>{
            chai.expect(entity.has(PositionComponent)).to.equal(false);
            let comp = new PositionComponent({x:42,y:12});
            entity.add(comp);
            chai.expect(entity.has(PositionComponent)).to.equal(true);
        })
    });

    describe('#get', ()=> {
        it('Adds PositionComponent and expects it to get returned by the get method',()=> {
            chai.expect(entity.get(PositionComponent)).to.equal(undefined);
            let comp = new PositionComponent({x:42, y:12});
            entity.add(comp);
            chai.expect(entity.get(PositionComponent)).to.equal(comp);
        });
    });

    describe('#has',()=>{
        it('Adds PositionComponent and expects it has to return true',()=> {
            let comp = new PositionComponent({x:42, y:12});
            entity.add(comp);
            chai.expect(entity.has(PositionComponent)).to.equal(true);
        });
    });

    describe('#remove', ()=>{
        it('Adds Position component and call remove to be true',()=> {
            let comp = new PositionComponent({x:42, y:12});
            entity.add(comp);
            chai.expect(entity.remove(PositionComponent)).to.equal(true);
            chai.expect(entity.has(PositionComponent)).to.equal(false);
        });
    });

    describe('#dispose',()=>{
        it('Disposed the Entity and removes it from the ECS but keeps the Entities Components',()=>{
            chai.expect(ECS.hasEntity(entity)).to.equal(true);
            entity = entity.dispose();
            chai.expect(ECS.hasEntity(entity)).to.equal(false);
            chai.expect(entity.has(NameComponent)).to.equal(true);
        });

        it('Removes all entities from the ecs, but the entities keep all components', ()=>{
            const sEntity:IEntity = new Entity({x:12,y:69});
            ECS.addEntity(sEntity);
            chai.expect(entity.has(NameComponent)).to.equal(true);
            chai.expect(sEntity.has(NameComponent)).to.equal(true);
            chai.expect(ECS.hasEntity(entity)).to.equal(true);
            chai.expect(ECS.hasEntity(sEntity)).to.equal(true);
            ECS.removeAllEntities();
            chai.expect(entity.has(NameComponent)).to.equal(true);
            chai.expect(sEntity.has(NameComponent)).to.equal(true);
            chai.expect(ECS.hasEntity(entity)).to.equal(false);
            chai.expect(ECS.hasEntity(sEntity)).to.equal(false);
        });
    });

    describe('#destroy',()=>{
        it('Destroy the Entity and removes it from the ECS also removes all components',()=>{
            chai.expect(ECS.hasEntity(entity)).to.equal(true);
            entity.destroy(true);
            chai.expect(ECS.hasEntity(entity)).to.equal(false);
            chai.expect(entity.has(NameComponent)).to.equal(false);
        });

        it('Destroy all entities removing all of them from the ecs and removing all components', ()=>{
            const sEntity:IEntity = new Entity({x:12,y:69});
            ECS.addEntity(sEntity);
            chai.expect(entity.has(NameComponent)).to.equal(true);
            chai.expect(sEntity.has(NameComponent)).to.equal(true);
            chai.expect(ECS.hasEntity(entity)).to.equal(true);
            chai.expect(ECS.hasEntity(sEntity)).to.equal(true);
            ECS.destroyAllEntities();
            chai.expect(entity.has(NameComponent)).to.equal(false);
            chai.expect(sEntity.has(NameComponent)).to.equal(false);
            chai.expect(ECS.hasEntity(entity)).to.equal(false);
            chai.expect(ECS.hasEntity(sEntity)).to.equal(false);
        });
    });
});