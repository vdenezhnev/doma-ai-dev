var browserSync = require('browser-sync');
var browserSyncSpa = require('browser-sync-spa');

var proxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;

function browserSyncInit(baseDir, startPath) {

  browserSync.instance = browserSync.init({
    startPath: startPath,
    server: {
      baseDir: baseDir,
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
    browser: 'default',
    ui: {
      port: 4001
    },
    port: 4000,
    logLevel: 'debug'
  });
}

exports.serveDist = () => browserSyncInit('./dist', 'ru/admin/index.html')

exports.serveDistIntercom = () => browserSyncInit('./dist', 'ru/intercom/index.html');
exports.serveDistAdmin = () => browserSyncInit('./dist', 'ru/admin/index.html');
