const { merge } = require('webpack-merge');
const base = require('./webpack.base');

module.exports = merge(base, {
    devtool: 'inline-source-map',
    mode: 'development',
    devServer: {
        contentBase: './dist',
        openPage: 'index.html',
        proxy: {
            '/direction': {
                target: "http://127.0.0.1:8083/",
                secure: false
            },
            '/road': {
                target: "http://127.0.0.1:8083/",
                secure: false
            },
            '/route': {
                target: "http://127.0.0.1:8083/",
                secure: false
            }

        }
    },
});