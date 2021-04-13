const gulp = require('gulp');

exports.default = gulp.series(
    () => gulp.src('./fonts/*').pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/fonts`)),
    () => gulp.src('./fonts/Simple-Line-Icons.*').pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/styles/fonts`))
);

exports.build = gulp.series(
    () => gulp.src('./fonts/*').pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/fonts`)),
    () => gulp.src('./fonts/Simple-Line-Icons.*').pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}/styles/fonts`))
);