const gulp = require('gulp');

exports.default = gulp.series(
    () => gulp.src('./img/*')
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-ru/img/`)),
    () => gulp.src('./icon.png')
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-ru/`)),
);