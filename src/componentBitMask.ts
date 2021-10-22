import { Bitmask } from './bitmask';

export class ComponentBitMask {
    /**
     * name of the component and the bit position
     * @private
     */
    private components: { [name: string]: number };
    private size: number;

    constructor() {
        this.components = Object.create(null);
        this.size = 0;
    }

    clear(): void {
        this.components = Object.create(null);
        this.size = 0;
    }

    register(component: string): number {
        if (this.components[component] === undefined) {
            this.components[component] = this.size;
            this.size++;
        }
        return this.components[component]!;
    }

    remove(component: string): void {
        if (this.components[component] !== undefined) {
            delete this.components[component];
            this.size = Object.keys(this.components).length;
        }
    }

    buildMask(components: string[]): Bitmask {
        // Note: BitSet is significantly slower then the standard 32 bit number (8 to 14 ~ 43%) -> build own BitSet
        const bitmask = new Bitmask(this.size);
        for (let i = 0, component; (component = components[i]); i++) {
            bitmask.set(this.components[component]!, 1);
        }
        return bitmask;
    }
}
