
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path');

const dist = path.resolve(__dirname, 'dist')
const srcClient = path.resolve(__dirname, 'src/client')

module.exports = {
	entry: path.join(srcClient, 'index.js'),
	output: {
		path: path.join(dist, 'public'),
		filename: 'bundle.js'
	},
	plugins: [new HtmlWebpackPlugin({
		template: path.join(srcClient, 'template/index.html')
	})]
}
