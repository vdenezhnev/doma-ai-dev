const gulp = require('gulp');

exports.default = () => gulp.src(`./app/${process.env.FEATURE_NAME}/views/**/*.html`)
    .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/app/intercom/views/`));
