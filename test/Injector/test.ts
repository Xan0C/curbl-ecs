/**
 * Created by Soeren on 26.10.2017.
 */
import * as chai from "chai";
import {ECS} from "../../lib/ECS";
import {ISystem} from "../../lib/System";
import {IEntity} from "../../lib/Entity";

@ECS.Component()
export class PositionComponent  {

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
class SystemDeux implements ISystem {
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

@ECS.Injector.System({
    system:System
})
class Injected {

    public system:ISystem;

    constructor(){

    }


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

    describe('#inject', () => {
        it('#System#Checks that the system got injected as a property', () => {
            let injected = new Injected();
            chai.expect(injected.system).to.equal(ECS.getSystem(System));
        });
    });
});