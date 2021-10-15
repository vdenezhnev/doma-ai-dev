var gulp = require('gulp');
var browserSync = require('browser-sync');

const serve = (buildTask, serveTask) => {
    buildTask(() => {
        serveTask();
        gulp.watch('app/**', {
            ignoreInitial: true
        }, (done) => {
            buildTask(() => {
                browserSync.reload();
                done();
            });
        });
    });
}

exports.serveAdmin = () => {
    const buildAdminDev = require('./build/build').buildAdminDev;
    const serveAdmin = () => require('./build/server').serveDist('admin', 'ru');

    serve(buildAdminDev, serveAdmin);
};
exports.serveCourier = () => {
    const buildCourierDev = require('./build/build-courier').buildCourierDev;
    const serveCourier = () => require('./build/server').serveDist('courier');

    serve(buildCourierDev, serveCourier);
};
exports.serveLock = () => {
    const buildLockDev = require('./build/build-lock').buildLockDev;
    const serveLock = () => require('./build/server').serveDist('lock');

    serve(buildLockDev, serveLock);
};
exports.serveIntercomRu = () => {
    const buildIntercomDev = require('./build/build').buildIntercomDev('ru');
    const serveIntercom = () => require('./build/server').serveDist('intercom', 'ru');

    serve(buildIntercomDev, serveIntercom);
};
exports.serveIntercomEn = () => {
    const buildIntercomDev = require('./build/build').buildIntercomDev('en');
    const serveIntercom = () => require('./build/server').serveDist('intercom', 'en');

    serve(buildIntercomDev, serveIntercom);
};
exports.serveIntercomAr = () => {
    const buildIntercomDev = require('./build/build').buildIntercomDev('ar');
    const serveIntercom = () => require('./build/server').serveDist('intercom', 'ar');

    serve(buildIntercomDev, serveIntercom);
};
exports.build = require('./build/build').default;