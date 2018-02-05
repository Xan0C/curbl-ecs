import {Signal} from "./Signal";

/**
 * Quick and Dirty PropertyBindings wrapping/creating a PropertyDescriptor that
 * dispatched a Signal each time its set or get accessor is called
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

    /**
     * Creates new PropertyBindings that wrap the previous bindings
     * @param object
     * @param {string} propertyKey
     * @returns {{onPropertySet: Signal; onPropertyGet: Signal}}
     */
    private createPropertyBinding(object:any,propertyKey:string):{onPropertySet:Signal,onPropertyGet:Signal}{
        const propertyDescriptor = PropertyDescriptorBinder.getPropertyDescriptor(object,propertyKey);
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
            const signals = Object.create(null);
            signals.onPropertyGet = onPropertyGet;
            signals.onPropertySet = onPropertySet;
            return signals;
        }else{
            throw new Error('Property '+propertyKey+' is not a valid property Accessor');
        }
    }

    /**
     * Binds a Property returning signals that are dispatched each time the propety is accessed(get) or changed(set)
     * @param object - Object
     * @param {string} propertyKey - name of the property
     * @returns {{onPropertySet: Signal; onPropertyGet: Signal}} - Signals that are dispatched on PropertyChange
     */
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

    /**
     * Restores the old property descriptor
     * @param object
     * @param {string} propertyKey
     */
    private restorePropertyDescriptor(object:any,propertyKey:string):void{
        const propertyDescriptor = this.propertySignals.get(object).get(propertyKey).propertyDescriptor;
        Object.defineProperty(object,propertyKey,{
            configurable:propertyDescriptor.configurable,
            enumerable:propertyDescriptor.enumerable,
            get: propertyDescriptor.get,
            set: propertyDescriptor.set
        });
    }

    /**
     * Removes the Binding from a property
     * @param object - Object
     * @param {string} propertyKey - name of the property
     * @param {boolean} restore - if the old PropertyDescriptor should be restored {default: true}
     * @returns {boolean}
     */
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

    /**
     * Creates new PropertyDescriptor wrapping the old PropertyDescriptor and dispatching a Signal each time its called
     * @param {PropertyDescriptor} descriptor
     * @param {string} propertyKey
     * @returns {() => any}
     */
    private getter(descriptor:PropertyDescriptor,propertyKey:string):()=>any{
        const self = this;
        return function(){
            const val = descriptor.get.apply(this);
            if(self.propertySignals.has(this)) {
                let propBind = self.propertySignals.get(this).get(propertyKey);
                if (propBind) {
                    propBind.onPropertyGet.dispatch(this, propBind.propertyKey, val);
                }
            }
            return val;
        }
    }

    /**
     * Creates new PropertyDescriptor that wraps the setter PropertyDescriptor and dispatched a Signal each time its called
     * @param {PropertyDescriptor} descriptor
     * @param {string} propertyKey
     * @returns {(value: any) => void}
     */
    private setter(descriptor:PropertyDescriptor,propertyKey:string):(value:any)=>void{
        const self = this;
        return function(...args){
            descriptor.set.apply(this,args);
            if(self.propertySignals.has(this)) {
                const propBind = self.propertySignals.get(this).get(propertyKey);
                if (propBind) {
                    propBind.onPropertySet.dispatch(this, propBind.propertyKey);
                }
            }
        }
    }

    /**
     * Returns the PropertyDescriptor of an Object
     * @param o - Object
     * @param name - name of the property
     * @returns {PropertyDescriptor}
     */
    private static getPropertyDescriptor(o, name):PropertyDescriptor {
        let proto = o, descriptor;
        while (proto && !(
            descriptor = Object.getOwnPropertyDescriptor(proto, name))
            ) proto = proto.__proto__;
        return descriptor;
    }
}