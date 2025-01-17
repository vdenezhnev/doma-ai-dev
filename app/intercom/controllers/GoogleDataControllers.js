'use strict';

app.controller('DeleteGoogleDataCtrl', ['$scope', '$http', '$httpParamSerializer', 'Api', 'settings', 'User', 'ModalService', '$timeout', function($scope, $http, $httpParamSerializer, Api, settings, User, ModalService, $timeout) {
    $scope.login = '';
    $scope.password = '';
    $scope.token = '';
    $scope.deleted = false;

    $scope.submit = function() {
        $http.post(settings.API_URL.replace('/intercoms', ""), {
            Action: 'Login',
            Login: $scope.login,
            Password: Base64.encode($scope.password)
        }).then(function successCallback(response) {
            $scope.token = `SAS-TOKEN ${response.data.credentials.apiKeyId}:${response.data.credentials.token}`
        });
    };

    $scope.deleteData = function() {
        $http.post(settings.API_URL.replace('/intercoms', ""), {
            Action: 'DeleteUserProfile',
        }, {
            headers: {
                Authorization: $scope.token
            }
        }).then(function successCallback(response) {
            $scope.deleted = true;
        });
    }
}]);
