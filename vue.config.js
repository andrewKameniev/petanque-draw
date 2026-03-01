module.exports = {
    configureWebpack: {    devtool: 'source-map'  },
    publicPath: process.env.NODE_ENV === 'production'
        ? '/petanque-draw/dist/'
        : '/',
    pwa: {
        name: 'Petanque Draw',
        themeColor: '#471aa0',
        msTileColor: '#471aa0'
    }
}