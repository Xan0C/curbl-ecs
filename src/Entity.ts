import {IComponent} from "./Component";
import {ECS} from "./ECS";

/**
 * Created by Soeren on 28.06.2017.
 */

export declare type EntityDecoratorComponent = {component:{new(config?:{[x:string]:any}):any}, config?:{[x:string]:any}};

export interface IEntity {
    readonly id?:string;
    readonly componentMask?:number;
    get?<T extends IComponent>(comp:{new(...args):T}):T;
    getAll?():{[id:string]:IComponent};
    has?<T extends IComponent>(comp:{new(...args):T}):boolean;
    add?(component:IComponent):void;
    remove?<T extends IComponent>(component:{new(...args):T}):boolean;
    dispose?(destroy?:boolean):boolean;
}

const ENTITY_PROPERTIES = {
    id:()=>{return ECS.uuid();}
};

const ENTITY_PROTOTYPE = {
    get:()=>{return Entity.prototype.get;},
    getAll:()=>{return Entity.prototype.getAll;},
    has:()=>{return Entity.prototype.has;},
    add:()=>{return Entity.prototype.add;},
    remove:()=>{return Entity.prototype.remove;},
    dispose:()=>{return Entity.prototype.dispose;}
};

export const ENTITY_PROPERTY_DECORATOR = {
    componentMask:(obj)=>{
        Object.defineProperty(obj,"componentMask",{
            get: function(){return ECS.getEntityComponentMask(this);}
        });
    }
};

export function injectEntity(entity:IEntity){
    for(let propKey in ENTITY_PROPERTIES){
        if(entity[propKey] === undefined || entity[propKey] === null){
            entity[propKey] = ENTITY_PROPERTIES[propKey]();
        }
    }
    for(let propKey in ENTITY_PROPERTY_DECORATOR){
        if(entity[propKey] === undefined || entity[propKey] === null){
            ENTITY_PROPERTY_DECORATOR[propKey](entity);
        }
    }
    for(let protoKey in ENTITY_PROTOTYPE){
        if(entity.constructor && entity.constructor.prototype){
            if(entity.constructor.prototype[protoKey] === undefined || entity.constructor.prototype[protoKey] === null){
                entity.constructor.prototype[protoKey] = ENTITY_PROTOTYPE[protoKey]();
            }
        }else{
            if(entity[protoKey] === undefined || entity[protoKey] === null){
                entity[protoKey] = ENTITY_PROTOTYPE[protoKey]();
            }
        }
    }
}

export class Entity implements IEntity{

    readonly id:string;

    constructor(){
        this.id = ENTITY_PROPERTIES.id();
    }

    getAll():{[id:string]:IComponent}{
        return ECS.getComponents(this);
    }

    get<T extends IComponent>(component:{ new(...args):T }):T {
        return ECS.getComponent(this,component);
    }

    has<T extends IComponent>(component:{ new(...args):T }):boolean {
        return ECS.hasComponent(this,component);
    }

    add(component:IComponent):void{
        return ECS.addComponent(this,component);
    }

    remove<T extends IComponent>(component:{new(...args):T}):boolean{
        return ECS.removeComponent(this,component);
    }

    dispose(destroy?:boolean):boolean{
        return ECS.removeEntity(this,destroy)
    }

    get componentMask():number{
        return ECS.getEntityComponentMask(this);
    }
}