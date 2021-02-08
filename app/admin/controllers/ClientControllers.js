'use strict';

app.controller('ClientListCtrl', ['$scope', '$timeout', 'Api', 'settings',
    function($scope, $timeout, Api, settings) {
        $scope.clients = [];
        $scope.skip = 0;
        $scope.loadedAllClients = false;

        $scope.loadClients = function(take, reset) {
            var action = $scope.q ? 'SearchUsers' : 'GetLatestRegisteredUsers';
            Api.get(settings.API_URL, {'Action': action, 'Skip': $scope.skip, 'Take': take, 'SearchPhrase': $scope.q}, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.clients = response.data;
                }
                else {
                    $scope.clients.push.apply($scope.clients, response.data);
                }

                $scope.loadedAllClients = response.data.length < take;
            });
        };

        $scope.$watch('q', function(newVal, oldVal){
            if (newVal != oldVal) {
                $scope.skip = 0;
                $scope.loadClients(20, $scope.q ? true : false);
            }
        });

        $scope.loadClients(20);
    }
]);

app.controller('ClientDetailCtrl', ['$scope', '$timeout', '$state', '$stateParams', 'notify', 'Api', 'settings', '$filter',
    function($scope, $timeout, $state, $stateParams, notify, Api, settings, $filter) {
        Api.get(settings.API_URL, {'Action': 'GetUserProfile', 'UserId': $stateParams.id}, function(response) {
            $scope.client = response.data;
        });

        $scope.password = {value: null};

        $scope.save = function() {
            Api.post(settings.API_URL, {
                'Action': 'UpdateUserProfile',
                'UserId': $scope.client.id,
                'DisplayName': $scope.client.displayName,
                'Email': $scope.client.email,
                'PhoneNumber': $scope.client.phoneNumber
            }, function() {
                notify($filter('translate')('NOTIFY_PROFILE_UPDATED'));
            });
        };

        $scope.changePassword = function() {
            Api.post(settings.API_URL, {
                'Action': 'ChangeUserPassword',
                'UserId': $scope.client.id,
                'NewPassword': Base64.encode($scope.password.value)
            }, function() {
                notify($filter('translate')('NOTIFY_PASSWORD_UPDATED'));
                $scope.password.value = null;
            });
        };

        $scope.delete = function() {
            if (window.confirm($filter('translate')('NOTIFY_MESSAGE_USER_DELETE_CONFIRM'))) {
                Api.post(settings.API_URL, {
                    'Action': 'DeleteUser',
                    'UserId': $scope.client.id
                }, function () {
                    notify($filter('translate')('NOTIFY_USER_UPDATED'));
                    $state.go('admin.client.list');
                });
            }
        };

        $scope.blockKeys = function() {
            Api.post(settings.API_URL, {
                'Action': 'BlockUserPhoneKeys',
                'UserId': $scope.client.id
            }, function () {
                notify($filter('translate')('NOTIFY_KEYS_BLOCKED'));
            });
        };

        $scope.unblockKeys = function() {
            Api.post(settings.API_URL, {
                'Action': 'UnblockMobilePhoneKeys',
                'UserId': $scope.client.id
            }, function () {
                notify($filter('translate')('NOTIFY_KEYS_UNBLOCKED'));
            });
        };

        $scope.deleteKey = function(key) {
            if (window.confirm($filter('translate')('NOTIFY_MESSAGE_KEY_DELETE_CONFIRM'))) {
                Api.post(settings.API_URL, {
                    'Action': 'DeleteUserKey',
                    'UserId': $scope.client.id,
                    'KeyId': key.id
                }, function () {
                    if (key.originalKey) {
                        $scope.client.duplicateOrders.splice(key, 1);
                    }
                    else {
                        $scope.client.keys.splice(key, 1);
                    }
                    notify($filter('translate')('NOTIFY_KEY_DELETED'));
                });
            }
        };
    }
]);