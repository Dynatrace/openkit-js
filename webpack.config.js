var path = require('path');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, './src/OpenKitBuilder.ts'),
    output: {
        path: path.resolve(__dirname, './build/lib'),
        filename: 'bundle.js',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'ts-loader',
            }
        ]
    }
};