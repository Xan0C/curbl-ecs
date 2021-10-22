function noop() {}

export function addNoopMethodsToPrototype(object: any, methods: string[]) {
    for (let i = 0, protoKey; (protoKey = methods[i]); i++) {
        if (object.constructor && object.constructor.prototype) {
            if (object.constructor.prototype[protoKey] === undefined || object.constructor.prototype[protoKey] === null) {
                object.constructor.prototype[protoKey] = noop;
            }
        } else {
            if (object[protoKey] === undefined || object[protoKey] === null) {
                object[protoKey] = noop;
            }
        }
    }
}
