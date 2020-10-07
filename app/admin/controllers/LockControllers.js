'use strict';

app.controller('LockListCtrl', ['$scope', 'Api', 'settings',
    function($scope, Api, settings) {
        $scope.locks = [];
        $scope.skip = 0;
        $scope.loadedAllLocks = false;

        $scope.loadLocks = function(take, reset) {
            var action = $scope.q ? 'SearchLocks' : 'GetLatestRegisteredLocks';
            Api.get(settings.API_URL, {'Action': action, 'Skip': $scope.skip, 'Take': take, 'SearchPhrase': $scope.q}, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.locks = response.data;
                }
                else {
                    $scope.locks.push.apply($scope.locks, response.data);
                }

                $scope.loadedAllLocks = response.data.length < take;
            });

        };

        $scope.$watch('q', function(newVal, oldVal){
            if (newVal != oldVal) {
                $scope.skip = 0;
                $scope.loadLocks(20, $scope.q ? true : false);
            }
        });

        $scope.loadLocks(20);

        $scope.getTransport = function (transports, type) {
            var result = undefined;
            _.forEach(transports, function (transport) {
                if (transport.type === type) {
                    result = transport;
                    return false;
                }
            });

            return result;
        }
    }
]);

app.controller('LockDetailCtrl', ['$scope', '$state', '$stateParams', 'notify', 'Api', 'settings',
    function($scope, $state, $stateParams, notify, Api, settings) {
        $scope.filter = {
            gsmActive: false
        };

        Api.get(settings.API_URL, {'Action': 'GetLockById', 'LockId': $stateParams.id}, function(response) {
            $scope.lock = response.data;
            var index = _.findIndex($scope.lock.connectivity.transports, function (o) {
                return o.type === 'gsm';
            });
            if (index !== -1) {
                $scope.filter.gsmActive = true;
            }
        });
        $scope.isNew = false;

        $scope.$watch('filter.gsmActive', function (newVal) {
            if ($scope.lock) {
                var index = _.findIndex($scope.lock.connectivity.transports, function (o) {
                    return o.type === 'gsm';
                });
                if (newVal === true && index === -1) {
                    $scope.lock.connectivity.transports.push({type: 'gsm'});
                } else if (newVal === false) {
                    if (index !== -1) {
                        $scope.lock.connectivity.transports.splice(index, 1);
                    }
                }
            }
        });

        $scope.save = function() {
            Api.post(settings.API_URL, {
                Action: 'UpdateLock',
                LockId: $scope.lock.id,
                connectivity: $scope.lock.connectivity
            }, function() {
                notify('Замок обновлен');
            });
        };

        $scope.delete = function() {
            if (window.confirm('Вы действительно хотите удалить данный замок?')) {
                Api.post(settings.API_URL, {
                    'Action': 'DeleteLock',
                    'LockId': $scope.lock.id
                }, function () {
                    notify('Замок удален');
                    $state.go('admin.lock.list');
                });
            }
        };
    }
]);

app.controller('LockReplaceCtrl', ['$scope', '$state', '$stateParams', 'notify', 'Api', 'settings',
    function($scope, $state, $stateParams, notify, Api, settings) {
        Api.get(settings.API_URL, {Action: 'GetLockById', LockId: $stateParams.id}, function(response) {
            $scope.lock = response.data;
        });

        $scope.replace = function(newLockId) {
            Api.post(settings.API_URL, {
                Action: 'ReplaceLock',
                ReplaceableLockId: $scope.lock.id,
                ReplacementLockId: newLockId
            }, function() {
                notify('Замок обновлен');
                $state.go('admin.lock.detail', {id: newLockId});
            });
        };
    }
]);

app.controller('LockCreateCtrl', ['$scope', '$state', 'notify', 'Api', 'settings',
    function($scope, $state, notify, Api, settings) {
        $scope.createForm = true;
        $scope.isNew = true;

        $scope.lock = {
            connectivity: {
                gestures: {
                    useMethod1: false,
                    useMethod2: false
                },
                transports: [
                    {type: 'wiFiDirect', isActivated: false},
                    {type: 'blueTooth', isActivated: false},
                    {type: 'blueToothLe', isActivated: false},
                    {type: 'gsm', isActivated: false},
                    {type: 'nfc', isActivated: false}
                ]
            }
        };

        $scope.save = function() {
            Api.post(settings.API_URL, angular.extend({Action: 'RegisterLock'}, $scope.lock), function() {
                $state.go('admin.lock.detail', {id: $scope.lock.lockId});
                notify('Замок добавлен');
            });
        };
    }
]);
