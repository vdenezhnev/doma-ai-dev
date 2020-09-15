var browserSync = require('browser-sync');
var browserSyncSpa = require('browser-sync-spa');

var proxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;

function browserSyncInit(baseDir, browser) {
  browser = browser === undefined ? 'default' : browser;

  var server = {
    baseDir: baseDir,
    routes: {
        'ru/intercom/scripts': 'dist'
    }
  };

  server.middleware = [proxyMiddleware('/api', {target: 'https://testacms.smartairkey.com/', changeOrigin: true, secure: true})];

  browserSync.instance = browserSync.init({
    startPath: 'ru/intercom/',
    server: server,
    browser: browser,
    ui: {
      port: 4001
    },
    port: 4000
  });
}

exports.default = () => browserSyncInit('./');
exports.serveDist = () => browserSyncInit('./dist');
