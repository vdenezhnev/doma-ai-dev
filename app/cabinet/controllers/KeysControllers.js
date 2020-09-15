'use strict';

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
