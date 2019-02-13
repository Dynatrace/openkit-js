const path = require('path');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, './src/OpenKitBuilder.ts'),
    output: {
        path: path.resolve(__dirname, './dist/browser'),
        filename: 'openkit.js',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'ts-loader',
                options: {
                    configFile: 'tsconfig.browser.json'
                }
            }
        ]
    }
};