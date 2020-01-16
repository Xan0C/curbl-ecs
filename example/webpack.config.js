const path = require("path");

module.exports = {
    context: path.join(__dirname),
    entry: {
        bundle: path.join(__dirname, 'src/', 'index.ts')
    },
    output: {
        path:  path.join(__dirname, 'dist/'),
        filename: "[name].js"
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.jsx']
    },
    module: {
        rules: [
            {
                test:  /\.worker\.(ts|js)x?$/,
                loader: 'worker-loader',
                options: { publicPath: '/dist/' }
            },
            {
                test: /\.(ts|js)x?$/,
                loader: 'babel-loader'
            },
            {
                test: /\.(ts|js)$/,
                use: ["source-map-loader"],
                enforce: "pre"
            }
        ]
    },
    devtool: "source-map",
};