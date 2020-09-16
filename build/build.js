var gulp = require('gulp');
var env = require('gulp-env');

gulp.task('clean', require('./clean').default),
gulp.task('html', require('./html').default),
gulp.task('fonts', require('./fonts').default),
gulp.task('img', require('./img').default),
gulp.task('css', require('./css').default),
gulp.task('js', require('./js').default),
gulp.task('index', require('./index').default)

const build = gulp.series(
    'html',
    'fonts',
    'img',
    'css',
    'js',
    'index'
);

const setIntercomEnv = async () => env({
    file: './build/.intercom.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
    }
});
const setAdminEnv = async () => env({
    file: './build/.admin.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
    }
});
const buildIntercom = gulp.series(
    setIntercomEnv,
    build
);
const buildAdmin = gulp.series(
    setAdminEnv,
    build
);
exports.buildIntercom = buildIntercom;
exports.buildAdmin = buildAdmin;
exports.buildDev = gulp.series(
    'clean',
    async () => env.set({
        DEVMODE: true,
    }),
    buildIntercom,
    buildAdmin
)
exports.default = gulp.series(
    'clean',
    buildIntercom,
    buildAdmin
)
