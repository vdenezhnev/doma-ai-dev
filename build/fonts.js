const gulp = require('gulp');

exports.default = gulp.series(
    () => gulp.src('./fonts/*').pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-ru/fonts`)),
    () => gulp.src('./fonts/Simple-Line-Icons.*').pipe(gulp.dest(`./dist/${process.env.FEATURE_NAME}-ru/styles/fonts`))
);