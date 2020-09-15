'use strict';

app.controller('AppCtrl', ['$scope', '$http', '$state', 'UserClient', 'notify',
    function($scope, $http, $state, UserClient, notify) {

        $scope.logout = function () {
            UserClient.unload();
        };

        notify.config({
            duration: 3000
        });
    }
]);

app.controller('DefaultCtrl', ['$scope', '$state', 'UserClient',
    function($scope, $state, UserClient) {
        if (UserClient.isAuthenticated()) {
            $state.go('cabinet.profile');
        }
        else {
            window.location = '/';
        }
    }
]);