/**
 * Created by Soeren on 19.10.2017.
 */
import {spliceOne} from "../../src/util/ArrayUtil";

class Test {
    next:Test;
    private inc:number=0;

    update():void{
        this.inc++;
    }

}

describe('JS#Performance', function() {
    this.timeout(0);
    var amount:number = 250;

    beforeEach(() => {

    });

    afterEach(() => {

    });

    describe('JS#Lists', () => {
        it('Array', () => {
            const list = [];
            for(let i=0; i < amount; i++){
                list.push(new Test());
            }
            let time = process.hrtime();
            for(let test of list){
                test.update();
            }
            const diff = process.hrtime(time);
            console.log('Array: '+' %ds %dms', diff[0], diff[1]/1000000);
        });
        it('Array for loop indexed', () => {
            const list = [];
            for(let i=0; i < amount; i++){
                list.push(new Test());
            }
            let time = process.hrtime();
            for(let i=0; i < list.length; i++){
                list[i].update();
            }
            const diff = process.hrtime(time);
            console.log('Array indexed: '+' %ds %dms', diff[0], diff[1]/1000000);
        });
        it('Object', () => {
            const list:{[id:number]:any} = Object.create(null);
            for(let i=0; i < amount; i++){
                list[i] = new Test();
            }
            let time = process.hrtime();
            for(let id in list){
                list[id].update();
            }
            const diff = process.hrtime(time);
            console.log('Object: '+' %ds %dms', diff[0], diff[1]/1000000);
        });
        it('Map', () => {
            const list = new Map<number,Test>();
            for(let i=0; i < amount; i++){
                list.set(i,new Test());
            }
            let time = process.hrtime();
            for(let test of list.values()){
                test.update();
            }
            const diff = process.hrtime(time);
            console.log('Map: '+' %ds %dms', diff[0], diff[1]/1000000);
        });
        it('Set', () => {
            const list = new Set<Test>();
            for(let i=0; i < amount; i++){
                list.add(new Test());
            }
            let time = process.hrtime();
            for(let test of list.values()){
                test.update();
            }
            const diff = process.hrtime(time);
            console.log('Set: '+' %ds %dms', diff[0], diff[1]/1000000);
        });
        it('LinkedList', ()=>{
            let root = new Test();
            let next = root;
            for(let i=0; i < amount-1; i++){
                next.next = new Test();
                next = next.next;
            }
            let time = process.hrtime();
            let cnext = root;
            while(cnext){
                cnext.update();
                cnext = next.next;
            }
            const diff = process.hrtime(time);
            console.log('LinkedList: '+' %ds %dms', diff[0], diff[1]/1000000);
        })
    });

    describe('JS#Splice', () => {
        it('Array', () => {
            const list = [];
            for(let i=0; i < amount; i++){
                list.push(new Test());
            }
            let time = process.hrtime();
            for(let i=0; i < list.length; i++){
                list.splice(i,1);
            }
            const diff = process.hrtime(time);
            console.log('ArraySplice: '+' %ds %dms', diff[0], diff[1]/1000000);
        });
        it('ArrayFastSplice', () => {
            const list = [];
            for(let i=0; i < amount; i++){
                list.push(new Test());
            }
            let time = process.hrtime();
            for(let i=0; i < list.length; i++){
                spliceOne(list,i);
            }
            const diff = process.hrtime(time);
            console.log('ArrayFastSplice: '+' %ds %dms', diff[0], diff[1]/1000000);
        });
    });
});