'use strict';

var app = angular.module('app', [
    'ngStorage',
    'ngAnimate',
    'ngFileUpload',
    'ngResource',
    'ui.router',
    'permission',
    'angular-cache',
    'gettext',
    'cgNotify',
    'validation',
    'validation.rule',
    'angular-loading-bar',
    'ui.bootstrap.datetimepicker',
    'angularMoment',
    'smartkey.validation-rule',
    'ngSanitize',
    'angularModalService'
]);

app.config(['$httpProvider', '$locationProvider', function($httpProvider, $locationProvider) {
    $httpProvider.defaults.headers.post = {'Content-Type': 'application/json'};
    $httpProvider.interceptors.push('AuthorizationInterceptor');
    $httpProvider.interceptors.push('NotificationInterceptor');
    $httpProvider.interceptors.push('LanguageInterceptor');
    $httpProvider.interceptors.push('BrandIdInterceptor');

    $locationProvider.html5Mode(true);
}]);

app.run(['$rootScope', '$injector', '$timeout', '$state', 'Permission', 'User', 'Language', 'DataService', 'notify',  'gettextCatalog', 'settings',
    function($rootScope, $injector, $timeout, $state, Permission, User, Language, DataService, notify, gettextCatalog, settings){

        $rootScope.user = User;
        $rootScope.dataService = DataService;
        User.listen($rootScope);

        $rootScope.language = Language;
        $rootScope.currency = window.__currency;
        $rootScope.title = window.__title;
        $rootScope.settings = settings;
        gettextCatalog.setCurrentLanguage($rootScope.language.active);

        $rootScope.$on('user:logout', function (event) {
            $state.go('auth.login');
        });

        $rootScope.$on('user:login', function (event) {
            $timeout(function(){
                $state.go('admin.home');
            });
        });

        Permission.defineRole('anonymous', function (stateParams){
            return User.isAuthenticated() ? false : true;
        });

        $rootScope.$watch(function() {
            return $rootScope.user.isAuthenticated();
        }, function(newVal, oldVal) {
            if (newVal == true) {
                $timeout(function() {
                    DataService.load();
                });
            }
        });

        moment.locale($rootScope.language.active, {
            longDateFormat : {
                LT : 'HH:mm'
            }
        });

        notify.config({
            duration: 3000
        });

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
            if (fromState.hasOwnProperty('showConfirmation') && fromState.showConfirmation === true) {
                if (!fromState.hasOwnProperty('confirmationAnswer') || fromState.confirmationAnswer === undefined) {
                    $state.current.confirmationAnswer = window.confirm(
                        gettextCatalog.getString('notify.defaults.changes_will_not_be_saved')
                    );
                }

                if ($state.current.confirmationAnswer === false) {
                    return event.preventDefault();
                }
            }
        });

        setInterval(function () {
            $state.current.confirmationAnswer = undefined;
        }, 500);

    }
]);

app.factory('appCache', function(CacheFactory) {
    return CacheFactory('appCache');
});
