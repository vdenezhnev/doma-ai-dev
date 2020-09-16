var browserSync = require('browser-sync');
var browserSyncSpa = require('browser-sync-spa');

var proxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;

function browserSyncInit(baseDir, browser) {
  browser = browser === undefined ? 'default' : browser;

  // server.middleware = [
    // proxyMiddleware('/api', {target: 'https://testacms.smartairkey.com/', changeOrigin: true, secure: true}),
    // proxyMiddleware('/ru/intercom', {target: '/intercom', changeOrigin: false})
  // ];

  browserSync.instance = browserSync.init({
    startPath: './index-ru.html',
    server: {
      baseDir: "dist/intercom",
      directory: true,
      middleware: [
        proxyMiddleware('/api', {
          target: 'https://apitest.smartairkey.com',
          changeOrigin: true,
          secure: true,
          logLevel: 'debug'
        })
      ]
  },
    browser: browser,
    ui: {
      port: 4001
    },
    port: 4000,
    logLevel: 'debug'
  });
}

exports.default = () => browserSyncInit('./');
exports.serveDist = () => browserSyncInit('./dist');
