"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by Soeren on 16.06.2017.
 */
const SystemManagerTests = require("./systemManagerTests/tests");
const SystemTest = require("./systemTests/tests");
const ObjectPoolTest = require("./objectPoolTests/tests");
const FastSignalTest = require("./fastSignalTests/tests");
const EntityTests = require("./entityTests/tests");
SystemManagerTests['ENSUREIMPORT'] = true;
SystemTest['ENSUREIMPORT'] = true;
ObjectPoolTest['ENSUREIMPORT'] = true;
FastSignalTest['ENSUREIMPORT'] = true;
EntityTests['ENSUREIMPORT'] = true;
