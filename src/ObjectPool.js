"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ArrayUtil_1 = require("./util/ArrayUtil");
class Pool {
    constructor() {
        this.objects = [];
    }
    push(...objects) {
        this.objects.push(...objects);
    }
    remove(...objects) {
        for (let object of objects) {
            if (this.has(object)) {
                ArrayUtil_1.spliceOne(this.objects, this.objects.indexOf(object));
            }
        }
    }
    empty() {
        return this.objects.length > 0;
    }
    has(object) {
        return (this.objects.indexOf(object) >= 0);
    }
    pop() {
        return this.objects.pop();
    }
    dispose() {
        delete this.objects;
    }
    removeAll() {
        this.objects.length = 0;
    }
    clear() {
        this.objects.length = 0;
    }
}
class DynamicObjectPool {
    constructor() {
        this.pool = Object.create(null);
    }
    push(...objects) {
        for (let object of objects) {
            if (!this.pool[object.constructor.name]) {
                this.pool[object.constructor.name] = new Pool();
            }
            if (!this.has(object)) {
                this.pool[object.constructor.name].push(object);
            }
        }
    }
    remove(...objects) {
        if (objects && objects[0] && this.pool[objects[0].constructor.name]) {
            this.pool[objects[0].constructor.name].remove(...objects);
        }
    }
    removeAllOf(object) {
        if (this.hasOf(object)) {
            this.pool[object.prototype.constructor.name].removeAll();
        }
    }
    has(object) {
        if (this.pool[object.constructor.name]) {
            return this.pool[object.constructor.name].has(object);
        }
        return false;
    }
    hasOf(object) {
        if (this.pool[object.constructor.name]) {
            return !this.pool[object.prototype.constructor.name].empty();
        }
        return false;
    }
    pop(object) {
        if (this.pool[object.prototype.constructor.name] && !this.pool[object.prototype.constructor.name].empty()) {
            return this.pool[object.prototype.constructor.name].pop();
        }
        return undefined;
    }
    dispose() {
        this.pool = Object.create(null);
    }
    clear() {
        this.pool = Object.create(null);
    }
}
exports.DynamicObjectPool = DynamicObjectPool;
