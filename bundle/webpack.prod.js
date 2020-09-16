
module.exports = (webpackConfig, appPath) => {
	webpackConfig.output.filename = '[name].js'
	webpackConfig.output.chunkFilename = '[name].js'
	webpackConfig.output.libraryTarget = 'umd'
	return webpackConfig
}