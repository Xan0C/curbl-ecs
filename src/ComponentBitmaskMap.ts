import { Component } from './Component';

export interface BitmaskMap {
    [key: string]: number;
}

export class ComponentBitmaskMap {
    private _bitmaskMap: BitmaskMap;

    constructor() {
        this._bitmaskMap = Object.create(null);
    }

    has<T extends Component>(component: { new (config?: { [x: string]: any }): T } | string): boolean {
        if (typeof component === 'string') {
            return !!this._bitmaskMap[component];
        } else {
            return !!this._bitmaskMap[component.prototype.constructor.name];
        }
    }

    add<T extends Component>(component: { new (config?: { [x: string]: any }): T } | string) {
        if (typeof component === 'string') {
            this._bitmaskMap[component] = 1 << this.size;
        } else {
            this._bitmaskMap[component.prototype.constructor.name] = 1 << this.size;
        }
    }

    get<T extends Component>(component: { new (config?: { [x: string]: any }): T } | string): number {
        if (!this.has(component)) {
            this.add(component);
        }
        if (typeof component === 'string') {
            return this._bitmaskMap[component] || 0;
        }
        return this._bitmaskMap[component.prototype.constructor.name] || 0;
    }

    getCompound(components: { new (config?: { [x: string]: any }): any }[] | string[] = []): number {
        let bitmask = 0;
        for (let i = 0, component; (component = components[i]); i++) {
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
