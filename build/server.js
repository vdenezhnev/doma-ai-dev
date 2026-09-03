var browserSync = require('browser-sync');

var url = require('url');

var proxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;

/**
 * Отдаёт index.html приложения на «глубоких» адресах: клиентский роутер работает
 * в html5Mode, и файла /intercom-ru/abonent/list на диске не существует.
 *
 * Раньше этим занимался плагин browser-sync-spa. Вместе с fallback он включает
 * синхронизацию истории между вкладками, а она написана в расчёте на приложение
 * в корне сайта: сравнивает location.pathname с $location.path(). При заданном
 * <base href="/intercom-ru/"> эти значения не совпадают никогда, поэтому две
 * открытые вкладки бесконечно дописывали друг другу префикс базы, пока Angular
 * не падал с $rootScope:infdig. Плагин к тому же прибит к
 * connect-history-api-fallback@0.0.5, где путь к index.html захардкожен.
 */
function historyFallback(startPath) {
  var index = '/' + startPath + '/index.html';

  return function (req, res, next) {
    if (req.method !== 'GET') {
      return next();
    }

    var accept = req.headers && req.headers.accept;

    // Только переходы по страницам. XHR присылает */* или application/json,
    // и подменять ему ответ вёрсткой значит превращать 404 в 200 с html.
    if (typeof accept !== 'string' || accept.indexOf('text/html') === -1) {
      return next();
    }

    // Запрос файла отдаём статике как есть.
    if (/\.[^\/]+$/.test(url.parse(req.url).pathname)) {
      return next();
    }

    req.url = index;
    next();
  };
}

/**
 * В бою корень отдаёт редирект на приложение (см. nginx/frontend.conf), здесь
 * повторяем то же поведение. Без него на / приходит index.html с
 * <base href="/{startPath}/">, который Angular не может согласовать с текущим
 * адресом: страница остаётся пустой.
 *
 * Код 302, а не 301 как в nginx: постоянный редирект браузер кэширует намертво,
 * на локальной машине это потом не отменить.
 */
function redirectRoot(startPath) {
  return function (req, res, next) {
    if (req.method !== 'GET' || url.parse(req.url).pathname !== '/') {
      return next();
    }

    res.writeHead(302, {Location: '/' + startPath + '/'});
    res.end();
  };
}

function browserSyncInit(baseDir, startPath) {
  browserSync.instance = browserSync.init({
    startPath: startPath,
    // watch: true,
    server: {
      baseDir: baseDir,
      directory: true,
      middleware: [
        proxyMiddleware('/api', {
            target: 'http://localhost:5000',
          changeOrigin: true,
          secure: true,
          logLevel: 'debug'
        }),
        proxyMiddleware('/api/file', {
            target: 'http://localhost:5000',
          changeOrigin: true,
          secure: true,
          logLevel: 'debug'
        }),
        redirectRoot(startPath),
        historyFallback(startPath)
      ],
    },
    ui: {
      port: 4001
    },
    port: 4000,
    logLevel: 'debug'
  });
}

exports.serveDist = (app, locale) => {
  if (locale) {
    return browserSyncInit('./dist', `${app}-${locale}`);
  }

  return browserSyncInit('./dist', `${app}`);
};
