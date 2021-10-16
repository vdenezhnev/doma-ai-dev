'use strict';

app.controller('LockCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
    function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
        if (!$stateParams.locks || !$stateParams.uuid) {
            $state.go('lock.404');
        }

        $scope.locks = [];
        getStatus($stateParams.locks);

        $scope.uuid = $stateParams.uuid;

        $scope.onOpenLock = function (lockId) {
            $http.get(`${settings.API_URL}/open?lock=${lockId}&uuid=${$stateParams.uuid}`)
                .catch(function () {
                    notify('Не удалось открыть замок');
                });
        };

        $scope.isAvailable = function (lock) {
            return lock.Status === 'Online';
        };

        function getStatus(locks) {
            var eventSource = new EventSource(`${settings.API_URL}/lockstate?locks=${locks}`);

            eventSource.onmessage = function (event) {
                var lockState = JSON.parse(event.data);
                var eventLock = $scope.locks.find(function (e) {
                    return e.LockID === lockState.LockID;
                });

                if (eventLock === undefined) {
                    $scope.locks.push(lockState);
                } else {
                    if (!(lockState.Status === undefined && lockState.LockOpen === undefined)) {
                        if (lockState.Status !== undefined) {
                            eventLock.Status = lockState.Status;
                        }
                        if (lockState.LockOpen !== undefined) {
                            eventLock.LockOpen = lockState.LockOpen;
                        }
                        if (eventLock.Status === 'Online' && eventLock.LockOpen) {
                            notify(`Замок ${eventLock.LockID} открыт`);
                        } else {
                            notify(`Замок ${eventLock.LockID} закрыт`);
                        }
                    }
                }
            };
        }
    }
]);
