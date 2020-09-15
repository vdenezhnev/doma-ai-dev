const gulp = require('gulp');

exports.default = () => gulp.src('./img/*')
    .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/img/`));