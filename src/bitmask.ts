export class Bitmask {
    private mask: Uint32Array;

    constructor(bitLength: number, input?: Uint32Array) {
        this.mask = new Uint32Array(Math.ceil(bitLength / 32));
        if (input !== undefined) {
            this.mask.set(input);
        }
    }

    set(index: number, value: 0 | 1): void {
        const i = this.mask.length - ((index >>> 5) + 1);
        if (value === 0) {
            this.mask[i] = (this.mask[i]! | (1 << index)) ^ (1 << index);
        } else {
            this.mask[i] = this.mask[i]! | (1 << index);
        }
    }

    and(other: Bitmask): void {
        this.balance(other);
        for (let i = 0; i < this.mask.length; i++) {
            this.mask[i] = (this.mask[i]! & other.mask[i]!) >>> 0;
        }
    }

    /**
     * compare two bitmasks with and
     * e.g. this(110) and other(111) is true 110 & 111 === 110
     * while this(111) and other(110) is false 111 & 110 !== 111
     * @param other
     */
    compareAnd(other: Bitmask): boolean {
        this.balance(other);
        for (let i = 0; i < this.mask.length; i++) {
            const and = (this.mask[i]! & other.mask[i]!) >>> 0;
            if (this.mask[i] !== and) {
                return false;
            }
        }
        return true;
    }

    isEqual(other: Bitmask): boolean {
        this.balance(other);
        for (let i = 0; i < this.mask.length; i++) {
            if (this.mask[i] !== other.mask[i]) {
                return false;
            }
        }
        return true;
    }

    private balance(other: Bitmask): void {
        if (this.mask.length !== other.mask.length) {
            if (this.mask.length > other.mask.length) {
                other.grow(this.mask.length);
            } else {
                this.grow(other.mask.length);
            }
        }
    }

    private grow(length: number): void {
        const mask = new Uint32Array(length);
        mask.set(this.mask, (length || this.mask.length) - this.mask.length);
        this.mask = mask;
    }

    clone(): Bitmask {
        return new Bitmask(this.mask.length * 32, this.mask);
    }

    clear(): void {
        for (let i = 0; i < this.mask.length; i++) {
            this.mask[i] = 0;
        }
    }

    toString() {
        let out = '';
        const zeroes = '00000000000000000000000000000000';
        for (let i = 0; i < this.mask.length; i++) {
            const strH = this.mask[i]!.toString(2);
            const zerH = zeroes.substr(0, 32 - strH.length);
            out += zerH + strH;
        }
        return out;
    }
}
