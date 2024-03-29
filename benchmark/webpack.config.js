const path = require('path');

module.exports = {
    // bundling mode
    mode: 'production',

    // entry files
    entry: './web.ts',

    // output bundles (location)
    output: {
        path: path.resolve(__dirname, 'dist'),
        hashFunction: 'xxhash64',
        filename: 'main.js',
    },

    // file resolutions
    resolve: {
        extensions: ['.ts', '.js'],
    },

    // loaders
    module: {
        rules: [
            {
                test: /\.tsx?/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    configFile: 'tsconfig.bench.json',
                },
            },
        ],
    },
};
