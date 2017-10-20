export function spliceOne(array:any[],index:number){
    let len = array.length;
    if(len && index !== -1){
        while(index<len){
            array[index++] = array[index];
        }
        --array.length;
    }
}