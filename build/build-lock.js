var gulp = require('gulp');
var env = require('gulp-env');

gulp.task('clean', require('./clean').default),
gulp.task('html', require('./html').build),
gulp.task('fonts', require('./fonts').build),
gulp.task('img', require('./img').build),
gulp.task('css', require('./css').build),
gulp.task('js', require('./js').build),
gulp.task('index', require('./index').build),
gulp.task('lockLocale', require('./locale').lockLocale)

const build = gulp.series(
    'html',
    'fonts',
    'img',
    'css',
    'js',
    'index'
);

const setLockEnv = async () => env({
    file: './build/.lock.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
        API_URL_LOCK: process.env.API_URL_LOCK || 'api/lock',
    }
});
const buildLock = gulp.series(
    setLockEnv,
    build,
    'lockLocale'
);

exports.buildLockDev = gulp.series(
    'clean',
    async () => env.set({
        DEVMODE: true,
    }),
    buildLock,
    async () => gulp.src(`./dist/lock/index.html`).pipe(gulp.dest(`./dist`))
);
exports.default = buildLock;
