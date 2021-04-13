const gulp = require('gulp');

exports.default = gulp.series(
    () => gulp.src('./img/*')
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/img/`)),
    () => gulp.src('./icon.png')
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/`)),
);

exports.build = gulp.series(
    () => gulp.src('./img/*')
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/img/`)),
    () => gulp.src('./icon.png')
        .pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/`)),
);