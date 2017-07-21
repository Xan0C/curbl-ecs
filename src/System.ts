import {IEntity} from "./Entity";
import {ECS} from "./ECS";
import {Signal} from "./Signal";
/**
 * Created by Soeren on 28.06.2017.
 */
export interface ISystem {
    parent?:ISystem;
    readonly subsystems?:Map<string,ISystem>
    readonly entities?:Map<string,IEntity>;
    readonly componentMask?:number;
    readonly onEntityAdded?:Signal;
    readonly onEntityRemoved?:Signal;
    init?():void;
    addSubsystem?<T extends ISystem>(system:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>):T;
    has?(entity:IEntity):boolean;
    remove?(entity:IEntity,fromECS?:boolean,destroy?:boolean):void;
    dispose?():void;
}

export const SYSTEM_PROTOTYPE = {
    init:()=>{return ECS.noop;},
    has:()=>{return System.prototype.has;},
    remove:()=>{return System.prototype.remove;},
    dispose:()=>{return System.prototype.dispose},
    addSubsystem:()=>{return System.prototype.addSubsystem}
};

export const SYSTEM_PROPERTIES = {
    parent:()=>{return undefined;},
    onEntityAdded:()=>{return new Signal();},
    onEntityRemoved:()=>{return new Signal();}
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
    },
    subsystems:(obj)=>{
        Object.defineProperty(obj,"subsystems", {
            get: function(){return ECS.getSubsystems(this);}
        });
    },
};

export function injectSystem(system:ISystem,updateMethods:Array<string>=[]){
    for(let propKey in SYSTEM_PROPERTIES){
        if(system[propKey] === undefined || system[propKey] === null){
            system[propKey] = SYSTEM_PROPERTIES[propKey]();
        }
    }
    for(let propKey in SYSTEM_PROPERTY_DECORATOR){
        if(system[propKey] === undefined || system[propKey] === null){
            SYSTEM_PROPERTY_DECORATOR[propKey](system);
        }
    }
    for(let protoKey in SYSTEM_PROTOTYPE){
        if(system.constructor && system.constructor.prototype){
            if(system.constructor.prototype[protoKey] === undefined || system.constructor.prototype[protoKey] === null){
                system.constructor.prototype[protoKey] = SYSTEM_PROTOTYPE[protoKey]();
            }
        }else{
            if(system[protoKey] === undefined || system[protoKey] === null){
                system[protoKey] = SYSTEM_PROTOTYPE[protoKey]();
            }
        }
    }
    for(let protoKey of updateMethods){
        if(system.constructor && system.constructor.prototype){
            if(system.constructor.prototype[protoKey] === undefined || system.constructor.prototype[protoKey] === null){
                system.constructor.prototype[protoKey] = ECS.noop;
            }
        }else{
            if(system[protoKey] === undefined || system[protoKey] === null){
                system[protoKey] = ECS.noop;
            }
        }
    }
}

export class System implements ISystem {
    readonly parent:ISystem;
    readonly onEntityAdded:Signal;
    readonly onEntityRemoved:Signal;

    constructor(){
        this.parent = SYSTEM_PROPERTIES.parent();
        this.onEntityAdded = SYSTEM_PROPERTIES.onEntityAdded();
        this.onEntityRemoved = SYSTEM_PROPERTIES.onEntityRemoved();
    }

    addSubsystem<T extends ISystem>(system:T,componentMask?:Array<{new(config?:{[x:string]:any}):any}>):T{
        return ECS.addSubsystem(this,system,componentMask);
    }

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

    get entities():Map<string,IEntity>{
        return ECS.getEntitiesForSystem(this);
    }

    get componentMask():number{
        return ECS.getSystemComponentMask(this);
    }

    get subsystems():Map<string,ISystem>{
        return ECS.getSubsystems(this);
    }
}