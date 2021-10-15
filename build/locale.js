const gulp = require('gulp');

exports.default = () => gulp.src('./app/admin/i18n/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/i18n/`));

exports.courierLocale = () => gulp.src('./app/courier/i18n/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/i18n/`));

exports.lockLocale = () => gulp.src('./app/lock/i18n/*')
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/i18n/`));

exports.laskomex = () => gulp.src('./app/admin/i18n/*')
    .pipe(gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/i18n/`));