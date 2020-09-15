'use strict';

app.controller('ProfileCtrl', ['$scope', 'UserClient', 'notify', 'gettextCatalog',
    function($scope, UserClient, notify, gettextCatalog) {

        $scope.updateProfile = function() {
            $scope.loader = UserClient.updateProfile({displayName: $scope.displayName})
                .then(function successCallback(response) {
                    notify({'message': gettextCatalog.getString('cabinet.profile.profile_updated')});
                }, function errorCallback(response) {
                    $scope.response = response.data;
                });
        };
    }
]);

app.controller('ChangePasswordCtrl', ['$scope', '$injector', 'UserClient', 'notify', 'gettextCatalog',
    function($scope, $injector, UserClient, notify, gettextCatalog) {

        $scope.changePassword = function() {
            $scope.loader = UserClient.changePassword($scope.oldPassword, $scope.newPassword)
                .then(function successCallback(response) {
                    notify({'message': gettextCatalog.getString('cabinet.profile.password_changed')});
                    $scope.closeThisDialog();
                }, function errorCallback(response) {
                    $scope.response = response.data;
                });
        }

}]);