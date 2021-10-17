// eslint-disable-next-line @typescript-eslint/no-var-requires
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'chai', 'karma-typescript'],
        files: [
            { pattern: 'test/**/*.ts', included: true, served: true, watched: false },
            { pattern: 'src/**/*.ts', included: true, served: true, watched: true },
        ],
        preprocessors: {
            '**/*.ts': 'karma-typescript',
        },
        karmaTypescriptConfig: {
            tsconfig: './tsconfig.test.json',
            reports: {
                html: {
                    directory: 'coverage',
                    subdirectory: '.',
                },
            },
            coverageOptions: {
                instrumentation: true,
                exclude: /\.(d|spec|test)\.ts/i,
            },
        },
        reporters: ['progress', 'karma-typescript'],
        browsers: ['ChromeHeadless'],
        logLevel: config.LOG_INFO,
        singleRun: true,
    });
};
