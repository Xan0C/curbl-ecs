import {IEntity} from "./Entity";
import {ECS} from "./ECS";
import * as EventEmitter from "eventemitter3";

/**
 * Created by Soeren on 28.06.2017.
 */
export interface ISystem {
    id?:string;
    bitmask?:number;
    readonly entities?:Array<IEntity>;
    readonly events?:EventEmitter;
    setUp?():void;
    tearDown?():void;
    has?(entity:IEntity):boolean;
    remove?(entity:IEntity,fromECS?:boolean,destroy?:boolean):void;
    dispose?():void;
}

export const SYSTEM_PROTOTYPE = {
    setUp:()=>{return ECS.noop;},
    tearDown:()=>{return ECS.noop;},
    has:()=>{return System.prototype.has;},
    remove:()=>{return System.prototype.remove;},
    dispose:()=>{return System.prototype.dispose}
};

export const SYSTEM_PROPERTIES = {
    bitmask:()=>{return 0},
    entities:()=>{return [];},
    events:()=>{return new EventEmitter();}
};

export const SYSTEM_PROPERTY_DECORATOR = {

};

export function injectSystem(system:ISystem,updateMethods:Array<string>){
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
    for(let i=0, protoKey; protoKey = updateMethods[i]; i++) {
        if (system.constructor && system.constructor.prototype) {
            if (system.constructor.prototype[protoKey] === undefined || system.constructor.prototype[protoKey] === null) {
                system.constructor.prototype[protoKey] = ECS.noop;
            }
        } else {
            if (system[protoKey] === undefined || system[protoKey] === null) {
                system[protoKey] = ECS.noop;
            }
        }
    }
}

export class System implements ISystem {

    readonly id:string;
    readonly bitmask:number;
    readonly entities:Array<IEntity>;
    readonly events:EventEmitter;

    constructor(){
        this.bitmask = SYSTEM_PROPERTIES.bitmask();
        this.entities = SYSTEM_PROPERTIES.entities();
        this.events = SYSTEM_PROPERTIES.events();
    }

    has(entity:IEntity):boolean {
        return this.entities.indexOf(entity) !== -1;
    }

    remove(entity:IEntity, fromECS:boolean=true, destroy?:boolean):void {
        if(fromECS) {
            if(destroy) {
                ECS.destroyEntity(entity,true);
            }
            else {
                ECS.removeEntity(entity);
            }
        }
        ECS.removeEntityFromSystem(entity, this);
    }

    dispose() {
        ECS.removeSystem(this);
    }
}