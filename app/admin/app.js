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
    'angularMoment',
    'ui.bootstrap.datetimepicker',
    'ja.qr',
]);

app.config(['$httpProvider', '$locationProvider', '$stateProvider',
    function($httpProvider, $locationProvider, $stateProvider) {
    $httpProvider.defaults.headers.post = {'Content-Type': 'application/json'};
    $httpProvider.interceptors.push('AdminInterceptor');

    $locationProvider.html5Mode(true);
}]);

app.constant('availableLocales', [
    { key: 'EN', displayName: 'English', isEnabled: true },
    { key: 'RU', displayName: 'Русский', isEnabled: true },
    { key: 'AR', displayName: 'العربية', isEnabled: false },
]);
app.constant('defaultLocale', { key: 'EN', displayName: 'English', isEnabled: true});

app.run(['$rootScope', '$timeout', '$state', 'Permission', 'User', '$localStorage', 'notify', 'defaultLocale',
    function($rootScope, $timeout, $state, Permission, User, $localStorage, notify, defaultLocale){
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

    $rootScope.$on('user:changeLocale', function () {
        document.location.reload();
    });

    Permission.defineRole('anonymous', function (stateParams){
        return User.isAuthenticated() ? false : true;
    });

    var selectedLocale = $localStorage.user_locale;

    if (!selectedLocale) {
        selectedLocale = defaultLocale.key;
    }

    if (selectedLocale === 'AR') {
        document.body.style.direction = 'rtl';
    } else {
        document.body.style.direction = 'ltr';
    }

    moment.locale(selectedLocale === 'AR' ? 'en' : selectedLocale.toLowerCase(), {
        longDateFormat : {
            LT : 'HH:mm'
        }
    });

    notify.config({
        duration: 3000
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

app.directive('selectNgFiles', function() {
    return {
        require: 'ngModel',
        link: function postLink(scope,elem,attrs,ngModel) {
            elem.on('change', function(e) {
                var files = elem[0].files;
                ngModel.$setViewValue(files);
            })
        }
    }
});