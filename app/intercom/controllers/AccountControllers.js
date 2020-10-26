
app.controller('AccountProfileCtrl', ['$scope', '$controller', '$state', '$http', 'User', 'settings', 'notify', 'gettextCatalog',
    function($scope, $controller, $state, $http, User, settings, notify, gettextCatalog) {
        $scope.userData = angular.copy(User.data);

        $http.get(`${settings.API_URL}?action=GetKeyCountServiceCompany`)
            .then(function successCallback(response) {
                angular.extend($scope.userData.keyCount, response.data);
            });

        $scope.save = function() {
            $http.post(settings.API_URL, angular.extend({Action: 'UpdateServiceCompany'}, $scope.userData))
                .then(function successCallback(response) {
                    notify(gettextCatalog.getString('account.profile_updated'));
                    User.data = response.data;
                    $scope.userData = angular.copy(User.data);
                });
        };
        
        $scope.removeAdmin = function($index) {
            var admin = $scope.userData.admins[$index];
            if (admin.id) {
                $http.post(settings.API_URL, {Action: 'RemoveAdminsServiceCompany', Admins: [admin.id]})
                    .success(function (response) {
                        notify(gettextCatalog.getString('Удален'));
                        User.data = response;
                        $scope.userData = angular.copy(User.data);
                    });
            }
            else {
                $scope.userData.admins.splice($index, 1);
            }
        };

        $scope.updateAdmins = function () {
            var updateAdmins = [];
            var addAdmins = [];

            angular.forEach($scope.userData.admins, function (admin, i) {
                if (admin.id) {
                    updateAdmins.push(admin);
                }
                else {
                    addAdmins.push(admin);
                }
            });

            $http.post(settings.API_URL, {Action: 'UpdateAdminsServiceCompany', Admins: updateAdmins})
                .then(function successCallback(response) {
                    notify(gettextCatalog.getString('account.profile_updated'));
                    User.data = response.data;
                    $scope.userData = angular.copy(User.data);
                });

            $http.post(settings.API_URL, {Action: 'AddAdminsServiceCompany', Admins: addAdmins})
                .then(function successCallback(response) {
                    User.data = response.data;
                    $scope.userData = angular.copy(User.data);
                });
        };

        $controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: $scope.userData
        });
    }
]);

app.controller('AccountChangePasswordCtrl', ['$scope', '$http', 'Session', 'settings', 'notify', 'gettextCatalog',
    function($scope, $http, Session, settings, notify, gettextCatalog) {
        $scope.save = function() {
            $http.post(settings.API_URL, {
                Action: 'ChangePassword',
                OldPassword: Base64.encode($scope.OldPassword),
                NewPassword: Base64.encode($scope.NewPassword)
            })
            .then(function successCallback(response) {
                notify(gettextCatalog.getString('account.password_changed'));
                Session.token = response.data.apiKeyId + ':' + response.data.token;
            });
        };
    }
]);
