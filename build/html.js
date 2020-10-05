const gulp = require('gulp');

exports.default = () => gulp.src(`./app/${process.env.FEATURE_NAME}/views/**/*.html`)
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/app/${process.env.FEATURE_NAME}/views/`));
