/**
 * Created by Soeren on 26.06.2017.
 */

export function createInstance<T extends any>(constructor:{new(...args):T},...args):T{
    return new (constructor.bind.apply(constructor,[void 0].concat(args)));
}

export function Inject(constructor:{new(...args):any},...args):PropertyDecorator{
    return function(target: Object, propertyKey: string | symbol):void{
        target[propertyKey] = new constructor(...args);
    }
}
