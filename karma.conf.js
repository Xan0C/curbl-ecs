module.exports = function(config) {
    config.set({
        frameworks: ["mocha", "chai", "karma-typescript"],
        files: [
            { pattern: "test/**/*.ts", included: true, served: true, watched: true},
            { pattern: "src/**/*.ts", included: true, served: true, watched: true},
        ],
        preprocessors: {
            "**/*.ts": "karma-typescript"
        },
        karmaTypescriptConfig: {
            tsconfig: "./test/tsconfig.json"
        },
        reporters: ["progress", "karma-typescript"],
        browsers: ["ChromeHeadless"],
        logLevel: config.LOG_INFO,
        singleRun: true
    });
};