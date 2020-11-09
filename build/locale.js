const gulp = require('gulp');

exports.default = () => gulp.src('./app/admin/i18n/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/i18n/`));