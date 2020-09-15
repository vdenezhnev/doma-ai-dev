const gulp = require('gulp');

exports.default = () => gulp.src('./img/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/img/`));