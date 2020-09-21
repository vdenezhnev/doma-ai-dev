var browserSync = require('browser-sync');
var spa = require('browser-sync-spa');

var proxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;

function browserSyncInit(baseDir, startPath) {
  browserSync.use(spa({
    selector: "[ng-app]",
    history: {
      index: startPath + '/index.html'
    }
  }))
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
      ],
    },
    browser: 'default',
    ui: {
      port: 4001
    },
    port: 4000,
    logLevel: 'debug'
  });
}

exports.serveDist = () => browserSyncInit('./dist', 'ru/intercom')

exports.serveDistIntercom = () => browserSyncInit('./dist', 'ru/intercom');
exports.serveDistAdmin = () => browserSyncInit('./dist', 'ru/admin');
