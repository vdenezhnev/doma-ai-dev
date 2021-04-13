var gulp = require('gulp');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var inject = require('gulp-inject');
var replace = require('gulp-replace');
const injectEnvs = require('gulp-inject-envs')
var env = require('gulp-env');

const injectionOptions = {
    ignorePath: 'dist',
    addRootSlash: true
};

const index = () => {
    const distFolder = `dist/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}`;
    var target = gulp.src(`./${process.env.FEATURE_NAME}.html`);
    var styles = gulp.src([`./${distFolder}/**/*.css`], {read: false});
    var vendor = gulp.src([`./${distFolder}/**/vendor.js`], {read: false});
    var bundle = gulp.src([`./${distFolder}/**/bundle.js`], {read: false});
    var httplog = gulp.src([`./${distFolder}/**/httplog.js`], {read: false});

    return target
        .pipe(inject(styles, injectionOptions))
        .pipe(inject(vendor, {...injectionOptions, name: 'vendor'}))
        .pipe(inject(bundle, {...injectionOptions, name: 'bundle'}))
        .pipe(gulpif(
            process.env.DEBUG,
            inject(httplog, {...injectionOptions, name: 'httplog'}),
            replace(/<script src="\/app\/common\/httplog\.js"><\/script>/gm, '')
        ))
        .pipe(injectEnvs({
            ...process.env,
            BASE_HREF: `/${process.env.FEATURE_NAME}-${process.env.LANGUAGE_CODE}/`
        }))
        .pipe(rename(`index.html`))
        .pipe(gulp.dest(`./${distFolder}/`));
};

const indexWithOutLangCode = () => {
    const distFolder = `dist/${process.env.FEATURE_NAME}`;
    var target = gulp.src(`./${process.env.FEATURE_NAME}.html`);
    var styles = gulp.src([`./${distFolder}/**/*.css`], {read: false});
    var vendor = gulp.src([`./${distFolder}/**/vendor.js`], {read: false});
    var bundle = gulp.src([`./${distFolder}/**/bundle.js`], {read: false});
    var httplog = gulp.src([`./${distFolder}/**/httplog.js`], {read: false});

    return target
        .pipe(inject(styles, injectionOptions))
        .pipe(inject(vendor, {...injectionOptions, name: 'vendor'}))
        .pipe(inject(bundle, {...injectionOptions, name: 'bundle'}))
        .pipe(gulpif(
            process.env.DEBUG,
            inject(httplog, {...injectionOptions, name: 'httplog'}),
            replace(/<script src="\/app\/common\/httplog\.js"><\/script>/gm, '')
        ))
        .pipe(injectEnvs({
            ...process.env,
            BASE_HREF: `/${process.env.FEATURE_NAME}/`
        }))
        .pipe(rename(`index.html`))
        .pipe(gulp.dest(`./${distFolder}/`));
};

exports.default = index;
exports.build = indexWithOutLangCode;