'use strict';

app.requires.push('ui.router', 'cgNotify', 'ngDialog');

app.config(['$locationProvider', '$stateProvider', function($locationProvider, $stateProvider) {

        $locationProvider.html5Mode(true);

        $stateProvider
            .state('default', {
                url: "/",
                controller: 'DefaultCtrl',
                templateUrl: '/app/cabinet/views/default.html'
            })
            .state('cabinet', {
                abstract: true,
                templateUrl: '/app/cabinet/views/cabinet.html'
            })
            .state('cabinet.profile', {
                url: "/profile",
                controller: 'ProfileCtrl',
                templateUrl: '/app/cabinet/views/cabinet.profile.html'
            })
            .state('cabinet.keys', {
                url: "/keys",
                controller: 'KeysCtrl',
                templateUrl: '/app/cabinet/views/cabinet.keys.html'
            })
            .state('cabinet.incoming-keys', {
                url: "/incoming-keys",
                controller: 'IncomingKeysCtrl',
                templateUrl: '/app/cabinet/views/cabinet.incoming_keys.html'
            })
            .state('cabinet.payment', {
                url: "/payment",
                controller: 'PaymentCtrl',
                templateUrl: '/app/cabinet/views/cabinet.payment.html'
            });
    }
]);

app.run(['$rootScope', '$state', 'UserClient', function($rootScope, $state, UserClient) {

    $rootScope.$watch(function () {
        return UserClient.isAuthenticated();
    }, function (newVal, oldVal) {
        if (!UserClient.isAuthenticated()) {
            window.location = '/' + $rootScope.language + '/';
        }
    });

}]);
