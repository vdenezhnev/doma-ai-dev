var gulp = require('gulp');
var clean = require('gulp-clean');

exports.default = () => gulp.src('./dist', {read: false, allowEmpty: true})
    .pipe(clean());