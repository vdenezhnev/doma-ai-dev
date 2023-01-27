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

app.controller('LockDetailCtrl', ['$scope', '$state', '$stateParams', 'notify', 'Api', 'settings', '$filter',
    function($scope, $state, $stateParams, notify, Api, settings, $filter) {
        const TRANSPORT_TYPES = ['blueToothLe', 'nfc', 'gsm', 'internet', 'wiFiDirect', 'blueTooth'];
        let tempTransports = [];
        Api.get(settings.API_URL, {'Action': 'GetLockById', 'LockId': $stateParams.id}, function(response) {
            $scope.lock = response.data;
            const transports = response.data.connectivity.transports.map(item => item.type);

            TRANSPORT_TYPES.forEach(type => {
                if (!transports.includes(type)) {
                    $scope.lock.connectivity.transports.push({type: type, isActivated: false});
                }
            });

            $scope.lock.connectivity.transports.forEach((transport, index) => {
                const tIndex = TRANSPORT_TYPES.findIndex(item => item === transport.type);

                tempTransports[tIndex] = transport;
            });
            $scope.lock.connectivity.transports = [...tempTransports];
        });
        $scope.isNew = false;

        $scope.allowEditLockVersion = false;
        $scope.oldLockVersion = "";

        $scope.save = function () {
            Api.post(settings.API_URL, {
                Action: 'UpdateLock',
                LockId: $scope.lock.id,
                connectivity: $scope.lock.connectivity,
                metadata: ($scope.allowEditLockVersion && $scope.oldLockVersion != $scope.lock.metadata.version) ? $scope.lock.metadata : null
            }, function () {
                notify($filter('translate')('NOTIFY_LOCK_UPDATED'));
            });
        };

        $scope.delete = function() {
            if (window.confirm($filter('translate')('NOTIFY_MESSAGE_LOCK_DELETE_CONFIRM'))) {
                Api.post(settings.API_URL, {
                    'Action': 'DeleteLock',
                    'LockId': $scope.lock.id
                }, function () {
                    notify($filter('translate')('NOTIFY_LOCK_DELETED'));
                    $state.go('admin.lock.list');
                });
            }
        };

        $scope.allowUpdateVersion = function () {
            if ($scope.allowEditLockVersion == false) {
                $scope.oldLockVersion = $scope.lock.metadata.version;
            }
            if (window.confirm($filter('translate')('NOTIFY_MESSAGE_LOCK_VERSION_CHANGE_CONFIRM'))) {
                $scope.allowEditLockVersion = true;
            }
        };
    }
]);

app.controller('LockReplaceCtrl', ['$scope', '$state', '$stateParams', 'notify', 'Api', 'settings', '$filter',
    function($scope, $state, $stateParams, notify, Api, settings, $filter) {
        Api.get(settings.API_URL, {Action: 'GetLockById', LockId: $stateParams.id}, function(response) {
            $scope.lock = response.data;
        });

        $scope.replace = function(newLockId) {
            Api.post(settings.API_URL, {
                Action: 'ReplaceLock',
                ReplaceableLockId: $scope.lock.id,
                ReplacementLockId: newLockId
            }, function() {
                notify($filter('translate')('NOTIFY_LOCK_UPDATED'));
                $state.go('admin.lock.detail', {id: newLockId});
            });
        };
    }
]);

app.controller('LockCreateCtrl', ['$scope', '$state', 'notify', 'Api', 'settings', '$filter',
    function($scope, $state, notify, Api, settings, $filter) {
        $scope.createForm = true;
        $scope.isNew = true;

        $scope.lock = {
            connectivity: {
                gestures: {
                    useMethod1: false,
                    useMethod2: false
                },
                transports: [
                    {type: 'blueToothLe', isActivated: false},
                    {type: 'nfc', isActivated: false},
                    {type: 'gsm', isActivated: false},
                    {type: 'internet', isActivated: false, radius: 0, coordinate: { x: 0, y: 0 }},
                    {type: 'wiFiDirect', isActivated: false},
                    {type: 'blueTooth', isActivated: false}
                ]
            }
        };

        $scope.save = function() {
            Api.post(settings.API_URL, angular.extend({Action: 'RegisterLock'}, $scope.lock), function() {
                $state.go('admin.lock.detail', {id: $scope.lock.lockId});
                notify($filter('translate')('NOTIFY_LOCK_ADDED'));
            });
        };
    }
]);
