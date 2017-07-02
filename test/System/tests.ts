import * as chai from "chai";
import {IEntity} from "../../lib/Entity";
import {ECS} from "../../lib/ECS";
import getOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor;
import {ISystem} from "../../lib/System";
/**
 * Created by Soeren on 29.06.2017.
 */

export class PositionComponent {

    public x;
    public y;

    constructor(config:{x:number,y:number}){
        this.x = config.x;
        this.y = config.y;
    }
}

@ECS.System(PositionComponent)
class System implements ISystem {
    entities:Map<string, IEntity>;
    componentMask:number;
    public x;
    public y;

    constructor(config:{x:number,y:number}){
        this.x = config.x;
        this.y = config.y;
    }
}

describe('EntityDecorator', function() {
    var system:ISystem;
    this.timeout(0);

    beforeEach(() => {
        system = new System({x:42,y:12});
    });

    afterEach(() => {
        system.dispose();
    });

    describe('#entities', () => {
        it('Checks that a entities property descriptor got created', () => {


        });
    });

    describe('#componentMask', ()=> {
        it('Checks that the componentMask properties descriptor got created for the system',()=> {

        });
    });

    describe('#has',()=>{
        it('Checks if the Entity is in the system',()=> {

        });
    });

    describe('#remove', ()=>{
        it('Removes an Entity from the System, or from all systems',()=> {

        });
    });

    describe('#dispose',()=>{
        it('Disposed the System and removes it from the ECS',()=>{

        });
    })
});