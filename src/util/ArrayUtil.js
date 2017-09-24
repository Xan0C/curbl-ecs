"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function spliceOne(array, index) {
    let len = array.length;
    if (len) {
        while (index < len) {
            array[index++] = array[index];
        }
        --array.length;
    }
}
exports.spliceOne = spliceOne;
