class Pool<T> {
    private objects:Array<T>;

    constructor(){
        this.objects = [];
    }

    push(...objects:T[]):void {
        this.objects.push(...objects);
    }

    remove(...objects:T[]):void {
        for(let i=0, object; object = objects[i]; i++){
            if(this.has(object)){
                this.objects.splice(this.objects.indexOf(object),1);
            }
        }
    }

    empty():boolean{
        return this.objects.length>0;
    }

    has(object:T):boolean {
        return (this.objects.indexOf(object) >= 0);
    }

    pop():T{
        return this.objects.pop();
    }

    dispose():void{
        delete this.objects;
    }

    removeAll():void{
        this.objects.length = 0;
    }

    clear():void{
        this.objects.length = 0;
    }
}

export class DynamicObjectPool {

    private pool:{[id:string]:Pool<any>};

    constructor(){
        this.pool = Object.create(null);
    }

    push<T extends any>(...objects:T[]):void {
        for(let i=0, object; object = objects[i]; i++){
            if(!this.pool[object.constructor.name]){
                this.pool[object.constructor.name] = new Pool<T>();
            }
            if(!this.has(object)) {
                this.pool[object.constructor.name].push(object);
            }
        }
    }

    remove<T extends any>(...objects:T[]):void {
        if(objects && objects[0] && this.pool[objects[0].constructor.name]) {
            this.pool[objects[0].constructor.name].remove(...objects);
        }
    }

    removeAllOf<T extends any>(object:{new(...args):T}):void{
        if(this.hasOf(object)) {
            this.pool[object.prototype.constructor.name].removeAll();
        }
    }

    has<T extends any>(object:T):boolean {
        if(this.pool[object.constructor.name]){
            return this.pool[object.constructor.name].has(object);
        }
        return false;
    }

    hasOf<T extends any>(object:{new(...args):T}):boolean{
        if(this.pool[object.constructor.name]){
            return !this.pool[object.prototype.constructor.name].empty();
        }
        return false;
    }

    pop<T extends any>(object:{new(...args):T}):T{
        if(this.pool[object.prototype.constructor.name] && !this.pool[object.prototype.constructor.name].empty()){
            return this.pool[object.prototype.constructor.name].pop();
        }
        return undefined;
    }

    dispose():void{
        this.pool = Object.create(null);
    }

    clear():void{
        this.pool = Object.create(null);
    }
}