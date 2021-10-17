import { ECS } from './ECS';

export function inject<T>(
    object: object,
    properties: { [key: string]: () => any },
    prototype: { [key: string]: (...args) => any },
    decorators: { [key: string]: (T) => void }
): T {
    for (const propKey in properties) {
        if (object[propKey] === undefined || object[propKey] === null) {
            object[propKey] = properties[propKey]();
        }
    }
    for (const propKey in decorators) {
        if (object[propKey] === undefined || object[propKey] === null) {
            decorators[propKey](object);
        }
    }
    for (const protoKey in prototype) {
        if (object.constructor && object.constructor.prototype) {
            if (object.constructor.prototype[protoKey] === undefined || object.constructor.prototype[protoKey] === null) {
                object.constructor.prototype[protoKey] = prototype[protoKey];
            }
        } else {
            if (object[protoKey] === undefined || object[protoKey] === null) {
                object[protoKey] = prototype[protoKey];
            }
        }
    }

    return object as unknown as T;
}

export function addNoopMethodsToPrototype(object: any, methods: string[]) {
    for (let i = 0, protoKey; (protoKey = methods[i]); i++) {
        if (object.constructor && object.constructor.prototype) {
            if (object.constructor.prototype[protoKey] === undefined || object.constructor.prototype[protoKey] === null) {
                object.constructor.prototype[protoKey] = ECS.noop;
            }
        } else {
            if (object[protoKey] === undefined || object[protoKey] === null) {
                object[protoKey] = ECS.noop;
            }
        }
    }
}
