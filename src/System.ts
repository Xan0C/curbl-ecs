import {IEntity} from "./Entity";
import {ECS} from "./ECS";
/**
 * Created by Soeren on 28.06.2017.
 */
export interface ISystem {
    readonly entities?:Map<string,IEntity>;
    readonly componentMask?:number;
    has?(entity:IEntity):boolean;
    remove?(entity:IEntity,fromECS?:boolean,destroy?:boolean):void;
    dispose?():void;
}

export const SYSTEM_PROTOTYPE = {
    has:()=>{return System.prototype.has;},
    remove:()=>{return System.prototype.remove;},
    dispose:()=>{return System.prototype.dispose}
};

export const SYSTEM_PROPERTIES = {

};

export const SYSTEM_PROPERTY_DECORATOR = {
    entities:(obj)=>{
        Object.defineProperty(obj,"entities", {
                get: function(){return ECS.getEntitiesForSystem(this);}
        });
    },
    componentMask:(obj)=>{
      Object.defineProperty(obj,"componentMask",{
            get: function(){return ECS.getSystemComponentMask(this);}
      });
    }
};

export function injectSystem(entity:IEntity){
    for(let propKey in SYSTEM_PROPERTIES){
        if(entity[propKey] === undefined || entity[propKey] === null){
            entity[propKey] = SYSTEM_PROPERTIES[propKey]();
        }
    }
    for(let propKey in SYSTEM_PROPERTY_DECORATOR){
        if(entity[propKey] === undefined || entity[propKey] === null){
            SYSTEM_PROPERTY_DECORATOR[propKey](entity);
        }
    }
    for(let protoKey in SYSTEM_PROTOTYPE){
        if(entity.constructor && entity.constructor.prototype){
            if(entity.constructor.prototype[protoKey] === undefined || entity.constructor.prototype[protoKey] === null){
                entity.constructor.prototype[protoKey] = SYSTEM_PROTOTYPE[protoKey]();
            }
        }else{
            if(entity[protoKey] === undefined || entity[protoKey] === null){
                entity[protoKey] = SYSTEM_PROTOTYPE[protoKey]();
            }
        }
    }
}

export class System implements ISystem {
    readonly entities:Map<string,IEntity>;
    readonly componentMask:number;

    has(entity:IEntity):boolean {
        return ECS.systemHasEntity(this,entity);
    }

    remove(entity:IEntity, fromECS:boolean=true, destroy?:boolean):void {
        if(fromECS) {
            ECS.removeEntity(entity,destroy);
        }
        ECS.removeEntityFromSystem(entity, this);
    }

    dispose() {
        ECS.removeSystem(this);
    }
}