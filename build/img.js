const gulp = require('gulp');

exports.default = gulp.series(
    () => gulp.src('./img/*')
        .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/img/`)),
    () => gulp.src('./icon.png')
        .pipe(gulp.dest(`./dist/ru/${process.env.FEATURE_NAME}/`)),
);