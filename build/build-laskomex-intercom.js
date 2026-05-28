var gulp = require('gulp');
var env = require('gulp-env');

gulp.task('html', require('./html').laskomex),
gulp.task('fonts', require('./fonts').laskomex),
gulp.task('img', require('./img').laskomex),
gulp.task('assets', require('./assets').laskomex),
gulp.task('css', require('./css').laskomex),
gulp.task('js', require('./js').laskomex),
gulp.task('index', require('./index').laskomex),
gulp.task('locale', require('./locale').laskomex)

const setLocaleRu = async () => env({
    file: './build/.ru.env.json'
});
const setLocaleEn = async () => env({
    file: './build/.en.env.json'
});
const setLocaleAr = async () => env({
    file: './build/.ar.env.json'
});

const buildLaskomex = gulp.series(
    'html',
    'fonts',
    'img',
    'assets',
    'css',
    'js',
    'index'
);

const setLaskomexIntercomEnv = async () => env({
    file: './build/.intercom.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
        API_URL_INTERCOM: process.env.API_URL_INTERCOM || 'api/web/intercoms',
        ONLINE_API_URL: process.env.ONLINE_API_URL || 'https://online.smartairkey.com:4445',
        APP_INTERCOM_TITLE: 'Laskomex',
        APP_BRAND_ID: 'laskomex',
    }
});

const buildLaskomexIntercom = gulp.series(
    setLaskomexIntercomEnv,
    setLocaleRu,
    buildLaskomex,
    setLocaleEn,
    buildLaskomex,
    setLocaleAr,
    buildLaskomex
);

exports.default = buildLaskomexIntercom;
