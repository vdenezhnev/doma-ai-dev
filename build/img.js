const gulp = require('gulp');
const rename = require('gulp-rename');

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

exports.laskomex = gulp.series(
    () => gulp.src('./img/*')
        .pipe(gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/img/`)),
    () => gulp.src('./laskomex_icon.png')
        .pipe(rename('icon.png'))
        .pipe(gulp.dest(`./dist/laskomex/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/`)),
);