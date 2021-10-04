'use strict';

app.controller('LockCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
    function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
        if (!$stateParams.lockId || !$stateParams.uuid) {
            $state.go('lock.404');
        }

        $scope.lockId = $stateParams.lockId;
        $scope.uuid = $stateParams.uuid;

        $scope.onOpenLock = function () {
            $http.get(`${settings.API_URL}/open?lock=${$stateParams.lockId}&uuid=${$stateParams.uuid}`)
                .then(function () {
                    notify($filter('translate')('NOTIFY_LOCK_OPENED'));
                })
                .catch(function (error) {
                    notify(error.data.error);
                });
        };
    }
]);
