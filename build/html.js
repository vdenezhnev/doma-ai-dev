const gulp = require('gulp');

exports.default = () => gulp.src(`./app/${process.env.FEATURE_NAME}/views/**/*.html`)
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/app/${process.env.FEATURE_NAME}/views/`));

exports.build = () => gulp.src(`./app/${process.env.FEATURE_NAME}/views/**/*.html`)
    .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/app/${process.env.FEATURE_NAME}/views/`));

exports.laskomex = () => gulp.src(`./app/${process.env.FEATURE_NAME}/views/**/*.html`)
    .pipe(gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/app/${process.env.FEATURE_NAME}/views/`));

