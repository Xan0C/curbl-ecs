/**
 * Created by Soeren on 27.06.2017.
 */

export class ComponentBitmaskMap {
    private bitmaskMap:Map<string,number>;

    constructor(){
        this.bitmaskMap = new Map<string,number>();
    }

    has<T extends IComponent>(component:{new(config?:{[x:string]:any}):T}|string):boolean{
        if(typeof component === "string"){
            return this.bitmaskMap.has(component);
        }else {
            return this.bitmaskMap.has(component.prototype.constructor.name);
        }
    }

    add<T extends IComponent>(component:{new(config?:{[x:string]:any}):T}|string){
        if(typeof component === "string"){
            this.bitmaskMap.set(component,1 << this.bitmaskMap.size);
        }else {
            this.bitmaskMap.set(component.prototype.constructor.name, 1 << this.bitmaskMap.size);
        }
    }

    get<T extends IComponent>(component:{new(config?:{[x:string]:any}):T}|string):number{
        if(!this.has(component)){
            this.add(component);
        }
        if(typeof component === "string"){
            return this.bitmaskMap.get(component);
        }
        return this.bitmaskMap.get(component.prototype.constructor.name)||0;
    }
}

export interface IComponent {}

