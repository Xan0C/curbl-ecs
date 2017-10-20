import * as chai from "chai";
import {IEntity} from "../../lib/Entity";
import {ECS} from "../../lib/ECS";
import {ISystem} from "../../lib/System";
import {IComponent} from "../../src/Component";

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
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(PositionComponent).x = 42;
            entity.get(PositionComponent).y = 42;
        }
    }
}

@ECS.System(PositionComponent)
class SystemTwo implements ISystem {
    readonly entities:Array<IEntity>;


    update():void{
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(PositionComponent).x = 12;
            entity.get(PositionComponent).y = 12;
        }
    }

    init():void{}
}

@ECS.System(PositionComponent)
class SystemThree implements ISystem {
    readonly entities:Array<IEntity>;

    update():void{
        for(let i=0,entity; entity = this.entities[i];i++){
            entity.get(PositionComponent).x = 1337;
            entity.get(PositionComponent).y = 1337;
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
            const NS_PER_SEC = 1e9;
            const time = process.hrtime();
            ECS.update();
            const diff = process.hrtime(time);
            console.log('ECS#UpdateTime: '+((diff[0]*NS_PER_SEC + diff[1]))/1000000+" milliseconds");
        });
    });

    describe('#createEntities', () => {
        it('entities#not_pooled#10k', () => {
            const NS_PER_SEC = 1e9;
            const time = process.hrtime();
            for(let i=0; i < 10000; i++){
                let entity = ECS.createEntity();
                entity.add(new PositionComponent({x:0,y:0}));
                ECS.addEntity(entity);
            }
            const diff = process.hrtime(time);
            console.log('ECS#CreateNotPooled: '+((diff[0]*NS_PER_SEC + diff[1]))/1000000+" milliseconds");
        });

        it('entities#pooled#10k', () => {
            for(let i=0; i < 10000; i++){
                let entity = ECS.createEntity();
                entity.add(new PositionComponent({x:0,y:0}));
                ECS.addEntity(entity);
                entity.dispose();
            }
            const NS_PER_SEC = 1e9;
            const time = process.hrtime();
            for(let i=0; i < 10000; i++){
                let entity = ECS.createEntity();
                entity.add(new PositionComponent({x:0,y:0}));
                ECS.addEntity(entity);
            }
            const diff = process.hrtime(time);
            console.log('ECS#CreatePooled: '+((diff[0]*NS_PER_SEC + diff[1]))/1000000+" milliseconds");
        });
    });

});