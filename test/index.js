"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EntityTest = require("./Entity/tests");
const SystemTest = require("./System/tests");
const SystemEntityTest = require("./SystemEntity/tests");
const PerformanceTest = require("./Performance/test");
const InjectorTest = require("./Injector/test");
EntityTest['ENSURE_IMPORT'] = true;
SystemTest['ENSURE_IMPORT'] = true;
SystemEntityTest['ENSURE_IMPORT'] = true;
PerformanceTest['ENSURE_IMPORT'] = true;
InjectorTest['ENSURE_IMPORT'] = true;
