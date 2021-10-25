import { expect } from 'chai';
import { Bitmask } from '../src/bitmask';

describe('Bitmask', function () {
    describe('#set', () => {
        it('set bit for bitmask length 32 bit', () => {
            const mask = new Bitmask(32);
            // when
            mask.set(31, 1);
            // then
            expect(mask.toString()).eq('10000000000000000000000000000000');
        });

        it('set bit for bitmask length 64 bit', () => {
            const mask = new Bitmask(64);
            // when
            mask.set(63, 1);
            // then
            expect(mask.toString()).eq('1000000000000000000000000000000000000000000000000000000000000000');
        });

        it('set bit to 0 which was previously 1', () => {
            const mask = new Bitmask(32);
            // when
            mask.set(3, 1);
            mask.set(3, 0);
            // then
            expect(mask.toString()).eq('00000000000000000000000000000000');
        });

        it('set bit to 0', () => {
            const mask = new Bitmask(32);
            // when
            mask.set(3, 0);
            // then
            expect(mask.toString()).eq('00000000000000000000000000000000');
        });
    });
    describe('#compareAnd', () => {
        it('should compare two bitmasks with and', () => {
            const mask = new Bitmask(32);
            mask.set(31, 1);
            const other = new Bitmask(64);
            other.set(31, 1);
            other.set(4, 1);
            // when
            // then
            expect(mask.compareAnd(other)).true;
        });
        it('should compare two bitmasks with and', () => {
            const mask = new Bitmask(32);
            mask.set(31, 1);
            mask.set(4, 1);
            const other = new Bitmask(32);
            other.set(31, 1);
            // when
            // then
            expect(mask.compareAnd(other)).false;
        });
    });
    describe('#clone', () => {
        it('should clone the bitmask', () => {
            const mask = new Bitmask(32);
            // when
            mask.set(31, 1);
            const clone = mask.clone();
            // then
            expect(mask.toString()).eq('10000000000000000000000000000000');
            expect(clone.toString()).eq('10000000000000000000000000000000');
        });
    });
});
