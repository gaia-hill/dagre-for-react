const path = require('path')

module.exports = (appPath,env) => {
	return {
		title: 'dagre-for-react',
		vue: false,
		hash: false,
		favicon: '',
		htmlFile: true,
		template: path.join(__dirname, '../template/index.ejs'),
		happypack: false,
		entry: env === 'production' ? {
			index: path.join(__dirname, '../src/index.js')
		} : {
			test: path.join(__dirname, '../src/test.js')
		},
		src: path.join(__dirname, '../src'),
		dist: path.join(__dirname, '../dist'),
		devServer: {
			port: 6700
		}
	}
}