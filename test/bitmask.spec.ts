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
    describe('#and', () => {
        it('and for 2 bitmasks with the same length', () => {
            const mask = new Bitmask(64);
            mask.set(34, 1);
            mask.set(1, 0);
            const other = new Bitmask(34);
            other.set(1, 1);
            other.set(34, 1);
            // when
            mask.and(other);
            // then
            expect(mask.toString()).eq('0000000000000000000000000000010000000000000000000000000000000000');
        });

        it('and for 2 bitmask of different sizes#this larger', () => {
            const mask = new Bitmask(64);
            mask.set(8, 1);
            const other = new Bitmask(32);
            other.set(8, 1);
            // when
            mask.and(other);
            // then
            expect(mask.toString()).eq('0000000000000000000000000000000000000000000000000000000100000000');
        });

        it('and for 2 bitmask of different sizes#other larger', () => {
            const mask = new Bitmask(32);
            mask.set(8, 1);
            const other = new Bitmask(64);
            other.set(8, 1);
            // when
            mask.and(other);
            // then
            expect(mask.toString()).eq('0000000000000000000000000000000000000000000000000000000100000000');
        });
    });
    describe('#compareAnd', () => {
        it('should compare two bitmasks with and', () => {
            const mask = new Bitmask(32);
            mask.set(31, 1);
            const other = new Bitmask(32);
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
