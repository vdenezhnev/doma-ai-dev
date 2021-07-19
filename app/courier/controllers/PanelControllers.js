'use strict';

app.controller('CourierPanelCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify',
  function($scope, $stateParams, $state, $http, $filter, settings, notify) {
    $scope.panelData = {};
    if (!$stateParams.code) {
      $state.go('courier.404');
    }

    $http.get(settings.API_URL + `/GetCourierCompositeKey?code=${$stateParams.code}`).then(function(response) {
      $scope.panelData = response.data;
      $scope.accessPointPictureSrc = `${settings.API_HOST}api/file/images/binary/${$scope.panelData.pictureId}`;
    });

    $scope.onOpenPerimeter = function(perimetr) {
      if (perimetr) {
        $http.post(`${settings.API_URL}/OpenLock`, {
          courierPerimeterKeyId: perimetr.id
        }).then(function() {
          notify($filter('translate')('NOTIFY_LOCK_OPENED'));
        }).catch(function(error) {
          notify(error.data.error);
        });
      }
    };

    $scope.onOpenCell = function() {
        $http.post(`${settings.API_URL}/OpenPostamatCell`, {
          courierPostamatKeyId: $scope.panelData.courierPostamatKey.id
        }).then(function() {
          notify($filter('translate')('NOTIFY_CELL_OPENED'));
        }).catch(function(error) {
          notify(error.data.error);
        });
    };

    $scope.isValidAccess = function() {
      return !_.isEmpty($scope.panelData) && new Date($scope.panelData.validTill) > new Date();
    }
  }
]);