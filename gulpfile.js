exports.clean = require('./build/clean').default;
exports.html = require('./build/html').default;
exports.img = require('./build/img').default;
exports.fonts = require('./build/fonts').default;
exports.css = require('./build/css').default;
exports.js = require('./build/js').default;
exports.index = require('./build/index').default;

exports.build = require('./build/build').default;
exports.buildDev = require('./build/build').buildDev;
exports.server = require('./build/server').default;
exports.serveDistAdmin = require('./build/server').serveDistAdmin;
exports.serveDistIntercom = require('./build/server').serveDistIntercom;

exports.default = require('./build/server').default;