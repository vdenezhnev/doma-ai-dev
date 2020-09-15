'use strict';

app.controller('AppCtrl', ['$scope', '$http', '$state', 'User', 'notify',
    function($scope, $http, $state, User, notify) {
        $scope.logout = function () {
            User.unload();
        };

        notify.config({
            duration: 5000
        });
    }
]);


app.controller('LoginCtrl', ['$scope', '$http', '$state', 'notify', 'settings', 'User',
    function($scope, $http, $state, notify, settings, User) {
        $scope.submit = function() {
            $http.post(settings.API_URL, {
                Action: 'Login',
                Login: $scope.login,
                Password: Base64.encode($scope.password)
            }).then(function successCallback(response) {
                User.load(response.data.profile, response.data.credentials);
            });
        }
    }
]);