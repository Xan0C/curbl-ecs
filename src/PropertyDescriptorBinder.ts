import {Signal} from "./Signal";

/**
 * Quick and Dirty PropertyBindings wrapping/creating a PropertyDescriptor that
 */
export class PropertyDescriptorBinder {

    private propertySignals:WeakMap<Object,Map<string,{
        onPropertySet:Signal,
        onPropertyGet:Signal,
        propertyKey:string,
        propertyDescriptor:PropertyDescriptor;
    }>>;

    constructor(){
        this.propertySignals = new WeakMap();
    }

    private createPropertyBinding(object:any,propertyKey:string):{onPropertySet:Signal,onPropertyGet:Signal}{
        let propertyDescriptor = PropertyDescriptorBinder.getPropertyDescriptor(object,propertyKey);
        if(propertyDescriptor && propertyDescriptor.get && propertyDescriptor.set) {
            let onPropertyGet = new Signal();
            let onPropertySet = new Signal();

            this.propertySignals.set(object,new Map());
            this.propertySignals.get(object).set(propertyKey, {
                onPropertySet:onPropertySet,
                onPropertyGet:onPropertyGet,
                propertyKey:propertyKey,
                propertyDescriptor:propertyDescriptor
            });
            Object.defineProperty(object,propertyKey,{
                configurable:propertyDescriptor.configurable,
                enumerable:propertyDescriptor.enumerable,
                get: this.getter(propertyDescriptor,propertyKey),
                set: this.setter(propertyDescriptor,propertyKey)
            });
            let signals = Object.create(null);
            signals.onPropertyGet = onPropertyGet;
            signals.onPropertySet = onPropertySet;
            return signals;
        }else{
            throw new Error('Property '+propertyKey+' is not a valid property Accessor');
        }
    }

    public bind(object:any,propertyKey:string):{onPropertySet:Signal,onPropertyGet:Signal}{
        let signals:{onPropertySet:Signal,onPropertyGet:Signal};

        if(this.propertySignals.has(object) && this.propertySignals.get(object).has(propertyKey)){
            signals = Object.create(null);
            signals.onPropertySet = this.propertySignals.get(object).get(propertyKey).onPropertySet;
            signals.onPropertyGet = this.propertySignals.get(object).get(propertyKey).onPropertyGet;
        }else{
            signals = this.createPropertyBinding(object,propertyKey);
        }

        return signals;
    }

    private restorePropertyDescriptor(object:any,propertyKey:string):void{
        let propertyDescriptor = this.propertySignals.get(object).get(propertyKey).propertyDescriptor;
        Object.defineProperty(object,propertyKey,{
            configurable:propertyDescriptor.configurable,
            enumerable:propertyDescriptor.enumerable,
            get: propertyDescriptor.get,
            set: propertyDescriptor.set
        });
    }

    public unbind(object:any,propertyKey?:string,restore:boolean=true):boolean{
        if(propertyKey && this.propertySignals.has(object) && this.propertySignals.get(object).has(propertyKey)){
            if(restore){
                this.restorePropertyDescriptor(object,propertyKey);
            }
            return this.propertySignals.get(object).delete(propertyKey);
        }else if(!propertyKey){
            if(restore){
                for(let key of this.propertySignals.get(object).keys()){
                    this.restorePropertyDescriptor(object,key);
                }
            }
            return this.propertySignals.delete(object);
        }
        throw new Error("PropertyKey "+propertyKey+" does not exist");
    }

    private getter(descriptor:PropertyDescriptor,propertyKey:string):()=>any{
        let self = this;
        return function(){
            let val = descriptor.get.apply(this);
            if(self.propertySignals.has(this)) {
                let propBind = self.propertySignals.get(this).get(propertyKey);
                if (propBind) {
                    propBind.onPropertyGet.dispatch(this, propBind.propertyKey, val);
                }
            }
            return val;
        }
    }

    private setter(descriptor:PropertyDescriptor,propertyKey:string):(value:any)=>void{
        let self = this;
        return function(...args){
            descriptor.set.apply(this,args);
            if(self.propertySignals.has(this)) {
                let propBind = self.propertySignals.get(this).get(propertyKey);
                if (propBind) {
                    propBind.onPropertySet.dispatch(this, propBind.propertyKey);
                }
            }
        }
    }

    private static getPropertyDescriptor(o, name):PropertyDescriptor {
        let proto = o, descriptor;
        while (proto && !(
            descriptor = Object.getOwnPropertyDescriptor(proto, name))
            ) proto = proto.__proto__;
        return descriptor;
    }
}