'use strict';

app.controller('LockCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
    function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
        if (!$stateParams.locks || !$stateParams.uuid || !$stateParams.online_server) {
            $state.go('lock.404');
        }

        $scope.locks = [];

        $scope.uuid = $stateParams.uuid;

        $scope.online_server = $stateParams.online_server;

        var prelocks = $stateParams.locks.split(',');

        for (var i = 0; i < prelocks.length; i++) {
            let lock = prelocks[i]
            fetch(`https://${$stateParams.online_server}/lockauth?lock=${lock}&uuid=${$stateParams.uuid}`)
                .then(function(data){ return data.json();})
                .then(function(data){getStatus(lock, data.Token)});
        }

        $scope.onOpenLock = function (lockId) {
            $http.get(`https://${$stateParams.online_server}/open?lock=${lockId}&uuid=${$stateParams.uuid}`)
                .catch(function () {
                    notify('Не удалось открыть замок');
                });
        };

        $scope.isAvailable = function (lock) {
            return lock.Status === 'Online';
        };
        $scope.isOpen = function (lock) {
            return lock.LockOpen === true;
        }
        $scope.isConnected = function (lock) {
            return lock.Connected === true;
        }
        $scope.isDoorOpen = function (lock) {
            return lock.DoorOpen === true;
        }
        // https://online.airkey.ae:4445/lockstate?lock=78BQ3VH3RI6T46S&uuid=11111111-2222-3333-0000-000000000000&token=C232211054508A44
        function getStatus(lock, token) {
            var eventSource = new EventSource(`https://${$stateParams.online_server}/lockstate?lock=${lock}&uuid=${$stateParams.uuid}&token=${token}`);

            eventSource.onmessage = function (event) {
                var lockState = JSON.parse(event.data);
                var eventLock = $scope.locks.find(function (e) {
                    return e.LockID === lockState.LockID;
                });

                if (eventLock === undefined) {
                    $scope.locks.push(lockState);
                    $scope.$apply()
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