'use strict';

var app = angular.module('app', [
    'ui.router',
    'cgNotify',
    'ngAnimate',
    'angular-loading-bar',
    'angularModalService'
]);

app.config(['$httpProvider', '$locationProvider',
    function($httpProvider, $locationProvider) {
    $httpProvider.defaults.headers.post = {'Content-Type': 'application/json'};
    $locationProvider.html5Mode(true);
}]);

app.run(['notify',
    function(notify) {
        notify.config({
            duration: 3000
        });
}]);