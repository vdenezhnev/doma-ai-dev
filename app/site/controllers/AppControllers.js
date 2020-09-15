'use strict';

app.controller('AppCtrl', ['$scope', 'UserClient', function($scope, UserClient) {

    $scope.auth_tolabar = {
        'show': false,
        'form': 'login'
    };

    $scope.logout = function () {
        UserClient.unload();
    };

    $scope.loginShow = function($event) {
        $scope.auth_tolabar.show = true;
    };

}]);