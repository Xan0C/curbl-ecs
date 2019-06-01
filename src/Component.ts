import {ECS} from "./ECS";

export type BitmaskMap = {[key: string]: number};

export class ComponentBitmaskMap {
    private _bitmaskMap: BitmaskMap;

    constructor(){
        this._bitmaskMap = Object.create(null);
    }

    has<T extends IComponent>(component: {new(config?: {[x: string]: any}): T}|string): boolean{
        if(typeof component === "string"){
            return !!this._bitmaskMap[component];
        }else {
            return !!this._bitmaskMap[component.prototype.constructor.name];
        }
    }

    add<T extends IComponent>(component: {new(config?: {[x: string]: any}): T}|string){
        if(typeof component === "string"){
            this._bitmaskMap[component] = 1 << this.size;
        }else {
            this._bitmaskMap[component.prototype.constructor.name] = 1 << this.size;
        }
    }

    get<T extends IComponent>(component: {new(config?: {[x: string]: any}): T}|string): number{
        if(!this.has(component)){
            this.add(component);
        }
        if(typeof component === "string"){
            return this._bitmaskMap[component]||0;
        }
        return this._bitmaskMap[component.prototype.constructor.name]||0;
    }

    getCompound(components: {new(config?: {[x: string]: any}): any}[] | string[] =[]): number {
        let bitmask = 0;
        for(let i=0, component; component = components[i]; i++) {
            bitmask = bitmask | this.get(component);
        }
        return bitmask;
    }

    get size(): number {
        return Object.keys(this._bitmaskMap).length;
    }

    set(map: BitmaskMap): void {
        this._bitmaskMap = map;
    }

    get bitmaskMap(): { [p: string]: number } {
        return this._bitmaskMap;
    }
}

const COMPONENT_PROPERTIES = {
};

const COMPONENT_PROTOTYPE = {
    remove:()=>{return ECS.noop;}
};

export const COMPONENT_PROPERTY_DECORATOR = {
    id: (component) => {
        Object.defineProperty(component, "id", {
            get: function() { return this._id || (this._id = this.constructor.name); },
            set: function(id: string) { this._id = id; }
        })
    }
};

export function injectComponent(component: IComponent){
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
    id?: string;
    remove?(): void;
}