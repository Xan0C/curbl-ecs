import { expect } from 'chai';
import { ComponentRegister } from '../src/componentRegister';

describe('ComponentBitMask', function () {
    let componentBitMask: ComponentRegister;

    beforeEach(() => {
        componentBitMask = new ComponentRegister();
    });

    describe('#buildMask', () => {
        it('build bitmask from a list of components', () => {
            // given
            componentBitMask.register('A');
            componentBitMask.register('B');
            componentBitMask.register('C');

            // when
            const set = componentBitMask.buildMask(['A', 'B', 'C']);
            // then
            expect(set.toString()).eq('00000000000000000000000000000111');
        });

        it('increase bitmask length for each new component', () => {
            // given
            componentBitMask.register('A');
            componentBitMask.register('B');
            componentBitMask.register('C');
            componentBitMask.register('D');
            componentBitMask.register('E');

            // when
            const setOne = componentBitMask.buildMask(['A', 'B']);
            const setTwo = componentBitMask.buildMask(['B', 'C']);
            const setThree = componentBitMask.buildMask(['D', 'E']);

            // then
            expect(setOne.toString()).eq('00000000000000000000000000000011');
            expect(setTwo.toString()).eq('00000000000000000000000000000110');
            expect(setThree.toString()).eq('00000000000000000000000000011000');
        });
    });
});
