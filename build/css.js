var gulp = require('gulp');
var useref = require('gulp-useref');
var minifyCss = require('gulp-minify-css');
var gulpif = require('gulp-if');

exports.default = () => gulp.src(`./${process.env.FEATURE_NAME}.html`)
    .pipe(useref({allowEmpty: true}))
    .pipe(gulpif('*.css', minifyCss()))
    .pipe(gulpif('*.css', gulp.dest(`./dist/${process.env.FEATURE_NAME}`)));