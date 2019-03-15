import {ECS} from "./ECS";

export class ComponentBitmaskMap {
    private bitmaskMap:{[key:string]:number};

    constructor(){
        this.bitmaskMap = Object.create(null);
    }

    has<T extends IComponent>(component:{new(config?:{[x:string]:any}):T}|string):boolean{
        if(typeof component === "string"){
            return !!this.bitmaskMap[component];
        }else {
            return !!this.bitmaskMap[component.prototype.constructor.name];
        }
    }

    add<T extends IComponent>(component:{new(config?:{[x:string]:any}):T}|string){
        if(typeof component === "string"){
            this.bitmaskMap[component] = 1 << this.size;
        }else {
            this.bitmaskMap[component.prototype.constructor.name] = 1 << this.size;
        }
    }

    get<T extends IComponent>(component:{new(config?:{[x:string]:any}):T}|string):number{
        if(!this.has(component)){
            this.add(component);
        }
        if(typeof component === "string"){
            return this.bitmaskMap[component]||0;
        }
        return this.bitmaskMap[component.prototype.constructor.name]||0;
    }

    get size(): number {
        return Object.keys(this.bitmaskMap).length;
    }
}

const COMPONENT_PROPERTIES = {
};

const COMPONENT_PROTOTYPE = {
    init:()=>{return ECS.noop;},
    remove:()=>{return ECS.noop;}
};

export const COMPONENT_PROPERTY_DECORATOR = {
};

export function injectComponent(component:IComponent){
    for(let propKey in COMPONENT_PROPERTIES){
        if(component[propKey] === undefined || component[propKey] === null){
            component[propKey] = COMPONENT_PROPERTIES[propKey]();
        }
    }
    for(let propKey in COMPONENT_PROPERTY_DECORATOR){
        if(component[propKey] === undefined || component[propKey] === null){
            COMPONENT_PROPERTY_DECORATOR[propKey](component);
        }
    }
    for(let protoKey in COMPONENT_PROTOTYPE){
        if(component.constructor && component.constructor.prototype){
            if(component.constructor.prototype[protoKey] === undefined || component.constructor.prototype[protoKey] === null){
                component.constructor.prototype[protoKey] = COMPONENT_PROTOTYPE[protoKey]();
            }
        }else{
            if(component[protoKey] === undefined || component[protoKey] === null){
                component[protoKey] = COMPONENT_PROTOTYPE[protoKey]();
            }
        }
    }
}

export interface IComponent {
    /**
     * Id for this Component usually the class name
     * used internally
     */
    id?:string;
    init?(...args):void;
    remove?():void;
}