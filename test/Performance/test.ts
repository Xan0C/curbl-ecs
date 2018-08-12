import * as chai from "chai";
import {IEntity} from "../../lib/Entity";
import {ECS} from "../../lib/ECS";
import {ISystem} from "../../lib/System";
import {IComponent} from "../../lib/Component";

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
    componentMask:number;
    public x;
    public y;

    constructor(config:{x:number,y:number}){
        this.x = config.x;
        this.y = config.y;
    }

    update():void{
        const entities = this.entities;
        for(let i=0,entity; entity = entities[i];i++){
            entity.components.PositionComponent.x = 42;
            entity.components.PositionComponent.y = 42;
        }
    }
}

@ECS.System(PositionComponent)
class SystemTwo implements ISystem {
    readonly entities:Array<IEntity>;


    update():void{
        const entities = this.entities;
        for(let i=0,entity; entity = entities[i];i++){
            entity.components.PositionComponent.x = 12;
            entity.components.PositionComponent.y = 12;
        }
    }

    init():void{}
}

@ECS.System(PositionComponent)
class SystemThree implements ISystem {
    readonly entities:Array<IEntity>;

    update():void{
        const entities = this.entities;
        for(let i=0,entity; entity = entities[i];i++){
            entity.components.PositionComponent.x = 1337;
            entity.components.PositionComponent.y = 1337;
        }
    }

    init():void{}
}

describe('SystemPerformance', function() {
    var systemOne:ISystem;
    var systemTwo:ISystem;
    var systemThree:ISystem;
    this.timeout(0);

    beforeEach(() => {
        systemOne = ECS.addSystem(new System({x:0,y:0}));
        systemTwo = ECS.addSystem(new SystemTwo());
        systemThree = ECS.addSystem(new SystemThree());
    });

    afterEach(() => {
        systemOne.dispose();
        systemTwo.dispose();
        systemThree.dispose();
    });

    describe('#update', () => {
        it('Checks time of update for a lot of entities 10k', () => {
            for(let i=0; i < 10000; i++){
                let entity = ECS.createEntity();
                entity.add(new PositionComponent({x:0,y:0}));
                ECS.addEntity(entity);
            }
            console.time('ECS#Update10k');
            ECS.update();
            console.timeEnd('ECS#Update10k');
        });
    });

    describe('#createEntities - ignore seems buggy', () => {
        it('entities#not_pooled#10k', () => {
            console.time('ECS#CreateEntitiesNotPooled10k');
            for(let i=0; i < 10000; i++){
                let entity = ECS.createEntity();
                entity.add(new PositionComponent({x:0,y:0}));
                ECS.addEntity(entity);
            }
            console.timeEnd('ECS#CreateEntitiesNotPooled10k');
        });

        it('entities#pooled#10k', () => {
            for(let i=0; i < 10000; i++){
                let entity = ECS.createEntity();
                entity.add(new PositionComponent({x:0,y:0}));
                ECS.addEntity(entity);
                entity.destroy();
            }
            console.time('ECS#CreateEntitiesPooled10k');
            for(let i=0; i < 10000; i++){
                let entity = ECS.createEntity();
                entity.add(new PositionComponent({x:0,y:0}));
                ECS.addEntity(entity);
            }
            console.timeEnd('ECS#CreateEntitiesPooled10k');
        });
    });

});