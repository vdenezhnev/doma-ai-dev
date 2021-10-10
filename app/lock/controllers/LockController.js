'use strict';

app.controller('LockCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
    function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
        if (!$stateParams.locks || !$stateParams.uuid) {
            $state.go('lock.404');
        }

        $scope.lockIds = [];
        $stateParams.locks.split(',')
            .forEach(function (lock) {
                getStatus(lock);
            });

        $scope.uuid = $stateParams.uuid;

        $scope.onOpenLock = function (lockId) {
            $http.get(`${settings.API_URL}/open?lock=${lockId}&uuid=${$stateParams.uuid}`)
                .then(getStatusOnOpen(lockId))
                .catch(function () {
                    notify('Не удалось открыть замок');
                });
        };

        function getStatusOnOpen(lockId) {
            $http.get(`${settings.API_URL}/lockstate?lock=${lockId}`)
                .then(function (response) {
                    if (response.data.LockOpen || response.data.DoorOpen) {
                        notify($filter('translate')('NOTIFY_LOCK_OPENED'));
                    } else {
                        notify('Не удалось открыть замок');
                    }
                })
                .catch(function () {
                    notify(`Не удалось узнать состояние замка ${lockId}`);
                });
        }

        function getStatus(lockId) {
            return $http.get(`${settings.API_URL}/lockstate?lock=${lockId}`)
                .then(function (response) {
                    var isAvailable =
                        response.data.Status === 'Online' &&
                        !response.data.LockOpen && !response.data.DoorOpen;

                    $scope.lockIds.push({
                            lockId: lockId,
                            status: isAvailable
                        }
                    );
                    if (!isAvailable) {
                        notify(`${lockId} недоступен для открытия`);
                    }
                })
                .catch(function () {
                    notify(`Не удалось узнать состояние замка ${lockId}`);
                });
        }
    }
]);
