var gulp = require('gulp');
var useref = require('gulp-useref');
var minifyCss = require('gulp-minify-css');
var gulpif = require('gulp-if');

exports.default = gulp.series(
    () => gulp.src(`./${process.env.FEATURE_NAME}.html`)
        .pipe(useref({allowEmpty: true}))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulpif('*.css', gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}`))),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jstree/dist/themes/default/32px.png`)
        .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/styles`)),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jquery-multi-select/img/switch.png`)
        .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/img`)),
);