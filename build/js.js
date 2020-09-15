var gulp = require('gulp');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify-es').default;
var gulpif = require('gulp-if');
var ngAnnotate = require('gulp-ng-annotate');

exports.default =  () => gulp.src(`./${process.env.FEATURE_NAME}.html`)
    .pipe(useref())
    .pipe(gulpif('*.js', ngAnnotate()))
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.js', gulp.dest(`./dist/${process.env.FEATURE_NAME}`)));