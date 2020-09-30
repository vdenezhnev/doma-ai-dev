const gulp = require('gulp');

exports.default = () => gulp.src('./assets/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-ru/assets/`));