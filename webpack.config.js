module.exports = {
    entry: {
        ecs:"./src/index.ts",
        test: "./test/index.ts"
    },
    devtool: "source-map",
    output: {
        path: __dirname + '/dist/',
        filename: '[name].bundle.js'
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            { test: /\.ts$/, loader: "ts-loader" }
        ]
    }
};