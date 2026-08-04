var gulp = require('gulp');
var env = require('gulp-env');
var rename = require('gulp-rename');
const injectEnvs = require('gulp-inject-envs');

/*
 * Экран сервисного доступа — одна статическая страница без Angular.
 * Сборки vendor/bundle ей не нужны: всё, кроме bwip-js, лежит инлайном в screen.html,
 * поэтому общий пайплайн (html/css/js/index) здесь не используется.
 */

const setScreenEnv = async () => env({
    file: './build/.screen.env.json',
    vars: {
        API_HOST: process.env.API_HOST || '/',
        SCREEN_API_URL: process.env.SCREEN_API_URL || 'api/screen',
    }
});

const page = () => gulp.src('./screen.html')
    .pipe(injectEnvs({ ...process.env }))
    .pipe(rename('index.html'))
    .pipe(gulp.dest('./dist/screen/'));

const vendor = () => gulp.src('./js/bwip-js-min.js')
    .pipe(gulp.dest('./dist/screen/js/'));

const icon = () => gulp.src('./icon.png')
    .pipe(gulp.dest('./dist/screen/'));

// allowEmpty — чтобы сборка не падала, пока фраза не записана: без файла экран
// просто молчит, картинка работает как обычно.
const voice = () => gulp.src('./screen-voice.mp3', { allowEmpty: true })
    .pipe(gulp.dest('./dist/screen/'));

const buildScreen = gulp.series(setScreenEnv, page, vendor, icon, voice);

exports.buildScreenDev = gulp.series(
    async () => env.set({ DEVMODE: true }),
    buildScreen
);

exports.default = buildScreen;
