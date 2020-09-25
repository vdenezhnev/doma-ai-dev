const gulp = require('gulp');

exports.default = () => gulp.src('./assets/*')
    .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/assets/`));