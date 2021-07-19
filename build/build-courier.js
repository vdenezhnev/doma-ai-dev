var gulp = require('gulp');
var env = require('gulp-env');

gulp.task('clean', require('./clean').default),
gulp.task('html', require('./html').build),
gulp.task('fonts', require('./fonts').build),
gulp.task('img', require('./img').build),
gulp.task('css', require('./css').build),
gulp.task('js', require('./js').build),
gulp.task('index', require('./index').build),
gulp.task('courierLocale', require('./locale').courierLocale)

const build = gulp.series(
    'html',
    'fonts',
    'img',
    'css',
    'js',
    'index'
);

const setCourierEnv = async () => env({
    file: './build/.courier.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
        API_URL_ADMIN: process.env.API_URL_ADMIN || 'api/courier',
    }
});
const buildCourier = gulp.series(
    setCourierEnv,
    build,
    'courierLocale'
);

exports.buildCourierDev = gulp.series(
    'clean',
    async () => env.set({
        DEVMODE: true,
    }),
    buildCourier,
    async () => gulp.src(`./dist/courier/index.html`).pipe(gulp.dest(`./dist`))
);
exports.default = buildCourier;
