'use strict';

var app = angular.module('app', [
    'ngStorage',
    'ui.router',
    'permission',
    'cgNotify',
    'validation',
    'validation.rule',
    'ngAnimate',
    'angular-loading-bar',
    'angularModalService',
]);

app.config(['$httpProvider', '$locationProvider', '$stateProvider',
    function($httpProvider, $locationProvider, $stateProvider) {
    $httpProvider.defaults.headers.post = {'Content-Type': 'application/json'};
    $httpProvider.interceptors.push('AdminInterceptor');

    $locationProvider.html5Mode(true);
}]);

app.run(['$rootScope', '$injector', '$timeout', '$state', 'Permission', 'User', 'Api', 'settings',
    function($rootScope, $injector, $timeout, $state, Permission, User, Api, settings){
    $rootScope.user = User;

    User.listen($rootScope);

    $rootScope.$on('user:logout', function (event) {
        $state.go('login');
    });

    $rootScope.$on('user:login', function (event) {
        $timeout(function(){
            $state.go('admin.client.list');
        });
    });

    Permission.defineRole('anonymous', function (stateParams){
        return User.isAuthenticated() ? false : true;
    });
}]);

app.factory('AdminInterceptor', ['$q', '$injector', function($q, $injector) {
    return {
        responseError: function(response) {
            var notify = $injector.get('notify');
            if (response.data.error || response.data.developerDetails) {
                notify({
                    message: [response.data.error, response.data.developerDetails].join(' - '),
                    classes: 'alert-danger'
                });
            }
            return $q.reject(response);
        }
    };
}]);

app.directive('mask', function(){
    return {
        restrict: 'A',
        link: function(scope, el, attrs){
            var mask = scope.$eval(attrs.mask);
            $(el).inputmask(mask.mask);
        }
    };
});
