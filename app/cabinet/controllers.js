'use strict';

app.controller('AppCtrl', ['$scope', '$http', '$state', 'User', 'notify',
    function($scope, $http, $state, User, notify) {

        $scope.logout = function () {
            User.unload();
        };

        notify.config({
            duration: 3000
        });
    }
]);

app.controller('DefaultCtrl', ['$scope', '$state', 'UserClient',
    function($scope, $state, User) {
        if (User.isAuthenticated()) {
            $state.go('cabinet.profile');
        }
        else {
            window.location = '/';
        }
    }
]);

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

app.controller('KeysCtrl', ['$scope', 'UserClient', 'notify', 'gettextCatalog',
    function($scope, UserClient, notify, gettextCatalog) {

        $scope.blockKeys = function() {
            $scope.loader = UserClient.blockKeys().then(function successCallback(response) {
                notify({'message': gettextCatalog.getString('cabinet.keys.keys_locked')});
            }, function errorCallback(response) {
                $scope.response = response.data;
            });
        };

        $scope.unblockKeys = function() {
            $scope.loader = UserClient.unblockKeys().then(function successCallback(response) {
                notify({'message': gettextCatalog.getString('cabinet.keys.keys_unlocked')});
            }, function errorCallback(response) {
                $scope.response = response.data;
            });
        };

        $scope.deleteKey = function(key) {
            if (window.confirm(gettextCatalog.getString('cabinet.keys.key_delete_confirm'))) {
                $scope.loader = UserClient.deleteKey(key).then(function successCallback(response) {
                    notify({'message': gettextCatalog.getString('cabinet.keys.key_deleted')});
                }, function errorCallback(response) {
                    $scope.response = response.data;
                });
            }
        };
    }
]);

app.controller('IncomingKeysCtrl', ['$scope', '$http', 'notify', 'UserClient', 'gettextCatalog',
    function($scope, $http, notify, UserClient, gettextCatalog) {

        $scope.deleteKey = function(key) {
            if (window.confirm(gettextCatalog.getString('cabinet.keys.key_delete_confirm'))) {
                $scope.loader = UserClient.deleteKey(key, key.id).then(function successCallback(response) {
                    notify({'message': gettextCatalog.getString('cabinet.keys.key_deleted')});
                }, function errorCallback(response) {
                    $scope.response = response.data;
                });
            }
        };
    }
]);

app.controller('PaymentCtrl', ['$scope', '$http', '$state', 'UserClient',
    function($scope, $http, $state, UserClient) {
        $scope.loader = UserClient.loadPayments(0, 100);
        $scope.data = {};

        $scope.payment = function() {
            $scope.loader = UserClient.paymentLink($scope.data.amount).then(function successCallback(response) {
                window.location = response.data.processPaymentUrl;
            }, function errorCallback(response) {
                $scope.response = response.data;
            });
        };
    }
]);
