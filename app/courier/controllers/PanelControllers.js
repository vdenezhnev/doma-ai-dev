'use strict';

app.controller('CourierPanelCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
    function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
        $scope.panelData = {};
        if (!$stateParams.code) {
            $state.go('courier.404');
        }

        $http.get(settings.API_URL + `/GetCourierCompositeKey?code=${$stateParams.code}`).then(function (response) {
            $scope.panelData = response.data;
            $scope.accessPointPictureSrc = `${settings.API_HOST}api/file/images/binary/${$scope.panelData.pictureId}`;
        });

        $scope.onOpenPerimeter = function (perimetr) {
            if (perimetr) {
                $http.post(`${settings.API_URL}/OpenLock`, {
                    courierPerimeterKeyId: perimetr.id
                }).then(function () {
                    notify($filter('translate')('NOTIFY_LOCK_OPENED'));
                }).catch(function (error) {
                    notify(error.data.error);
                });
            }
        };

        $scope.onOpenCell = function () {
            ModalService.showModal({
                templateUrl: `${settings.TEMPLATE_DIR}panel/modal.html`,
                controller: 'ModalOpenCell',
                preClose: (modal) => {
                    modal.element.modal('hide');
                }
            }).then(function (modal) {
                modal.element.modal();
                modal.close.then(function (result) {
                    if (result) {
                        $http.post(`${settings.API_URL}/OpenPostamatCell`, {
                            courierPostamatKeyId: $scope.panelData.courierPostamatKey.id
                        }).then(function () {
                            notify($filter('translate')('NOTIFY_CELL_OPENED'));
                        }).catch(function (error) {
                            notify(error.data.error);
                        });
                    }
                });
            });

        };

        $scope.isValidAccess = function () {
            return !_.isEmpty($scope.panelData) && new Date($scope.panelData.validTill) > new Date();
        }
    }
]);

app.controller('ModalOpenCell', ['$http', '$scope', 'close', '$element', 'settings', 'notify', '$filter',
    function ($http, $scope, close, $element, settings, notify, $filter) {
        $scope.close = function (result) {
            close(result, 500);
        };
    }
]);