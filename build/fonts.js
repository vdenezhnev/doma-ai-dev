const gulp = require('gulp');

exports.default = () => gulp.src('./fonts/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/fonts`));