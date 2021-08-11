var gulp = require('gulp');
var useref = require('gulp-useref');
var minifyCss = require('gulp-minify-css');
var gulpif = require('gulp-if');

exports.default = gulp.series(
    () => gulp.src(`./${process.env.FEATURE_NAME}.html`)
        .pipe(useref({allowEmpty: true}))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulpif('*.css', gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}`))),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jstree/dist/themes/default/32px.png`)
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/styles`)),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jquery-multi-select/img/switch.png`)
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/img`)),
);

exports.build = gulp.series(
    () => gulp.src(`./${process.env.FEATURE_NAME}.html`)
        .pipe(useref({allowEmpty: true}))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulpif('*.css', gulp.dest(`./dist/${process.env.FEATURE_NAME}`))),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jstree/dist/themes/default/32px.png`)
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/styles`)),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jquery-multi-select/img/switch.png`)
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/img`)),
);

exports.laskomex = gulp.series(
    () => gulp.src(`./${process.env.FEATURE_NAME}.html`)
        .pipe(useref({allowEmpty: true}))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulpif('*.css', gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}`))),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jstree/dist/themes/default/32px.png`)
        .pipe(gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/styles`)),
    () => gulp.src(`components/metronic/theme/assets/global/plugins/jquery-multi-select/img/switch.png`)
        .pipe(gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/img`)),
);