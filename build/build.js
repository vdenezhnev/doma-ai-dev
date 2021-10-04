var gulp = require('gulp');
var env = require('gulp-env');
var buildCourier = require('./build-courier').default;
var buildLock = require('./build-lock').default;
var buildLaskomexIntercom = require('./build-laskomex-intercom').default;

gulp.task('clean', require('./clean').default),
gulp.task('html', require('./html').default),
gulp.task('fonts', require('./fonts').default),
gulp.task('img', require('./img').default),
gulp.task('assets', require('./assets').default),
gulp.task('css', require('./css').default),
gulp.task('js', require('./js').default),
gulp.task('index', require('./index').default),
gulp.task('locale', require('./locale').default)

const setLocaleRu = async () => env({
    file: './build/.ru.env.json'
});
const setLocaleEn = async () => env({
    file: './build/.en.env.json'
});
const setLocaleAr = async () => env({
    file: './build/.ar.env.json'
});

const build = gulp.series(
    'html',
    'fonts',
    'img',
    'assets',
    'css',
    'js',
    'index'
);

const setIntercomEnv = async () => env({
    file: './build/.intercom.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
        API_URL_INTERCOM: process.env.API_URL_INTERCOM || 'api/web/intercoms',
        APP_INTERCOM_TITLE: process.env.APP_INTERCOM_TITLE || 'SmartAirkey',
        APP_BRAND_ID: process.env.APP_BRAND_ID || 'smartairkey',
    }
});

const setAdminEnv = async () => env({
    file: './build/.admin.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
        API_URL_ADMIN: process.env.API_URL_ADMIN || 'api/admin',
    }
});

const buildIntercom = gulp.series(
    setIntercomEnv,
    setLocaleRu,
    build,
    setLocaleEn,
    build,
    setLocaleAr,
    build
);

const buildAdmin = gulp.series(
    setAdminEnv,
    setLocaleRu,
    build,
    'locale'
);
exports.buildAdminDev = gulp.series(
    'clean',
    async () => env.set({
        DEVMODE: true,
    }),
    buildAdmin,
    async () => gulp.src(`./dist/admin-ru/index.html`).pipe(gulp.dest(`./dist`))
);
exports.buildIntercomDev = (locale) => gulp.series(
    'clean',
    async () => env.set({
        DEVMODE: true,
    }),
    locale === 'ru' ? setLocaleRu : (locale === 'ar' ? setLocaleAr : setLocaleEn),
    setIntercomEnv,
    build,
    async () => gulp.src(`./dist/intercom-${locale}/index.html`).pipe(gulp.dest(`./dist`))
);

exports.default = gulp.series(
    'clean',
    buildIntercom,
    buildLaskomexIntercom,
    buildAdmin,
    buildCourier,
    buildLock
);
