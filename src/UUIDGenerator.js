"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by Soeren on 02.07.2017.
 */
exports.UUIDGenerator = {
    uuid: () => { return ("" + 1e7 + -1e3 + -4e3 + -8e3 + -1e11).replace(/1|0/g, function () { return (0 | Math.random() * 16).toString(16); }); }
};
