const gulp = require('gulp');

exports.default = () => gulp.src('./fonts/*')
    .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/fonts`));