const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
    context: path.join(__dirname),
    entry: {
        bundle: path.join(__dirname, 'src/', 'index.ts'),
    },
    output: {
        path: path.join(__dirname, 'dist/'),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.jsx'],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_fnames: true,
                    keep_classnames: true,
                },
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.worker\.(ts|js)x?$/,
                loader: 'worker-loader',
                options: { publicPath: '/dist/' },
            },
            {
                test: /\.(ts|js)x?$/,
                loader: 'babel-loader',
            },
            {
                test: /\.(ts|js)$/,
                use: ['source-map-loader'],
                enforce: 'pre',
            },
        ],
    },
    plugins: [
        new CompressionPlugin({
            filename: '[path].gz[query]',
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8,
        }),
    ],
    devtool: 'source-map',
};
