const gulp = require('gulp');

exports.default = () => gulp.src('./assets/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/assets/`));

exports.laskomex = () => gulp.src('./assets/*')
    .pipe(gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/assets/`));