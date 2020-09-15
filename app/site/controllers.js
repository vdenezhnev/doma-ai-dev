'use strict';

app.controller('AppCtrl', ['$scope', 'AuthService', 'UserClient', function($scope, AuthService, UserClient) {

    $scope.auth_tolabar = {
        show: true,
        form: 'login'
    };

    $scope.logout = function () {
        UserClient.unload();
    };

}]);

