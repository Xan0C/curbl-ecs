export function spliceOne(array:any[],index:number){
    let len = array.length;
    if(len){
        while(index<len){
            array[index++] = array[index];
        }
        --array.length;
    }
}