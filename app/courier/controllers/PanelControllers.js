'use strict';

app.controller('CourierPanelCtrl', ['$scope', '$stateParams', '$state', '$http', 'settings',
  function($scope, $stateParams, $state, $http, settings) {
    $scope.panelData = {};
    if (!$stateParams.code) {
      $state.go('courier.404');
    }

    $http.get(settings.API_URL + `/GetCourierCompositeKey?code=${$stateParams.code}`).then(function(response) {
      $scope.panelData = response.data;
      $scope.accessPointPictureSrc = `${settings.API_HOST}api/file/images/binary/${$scope.panelData.pictureId}`;
    });

    $scope.onOpenPerimeter = function(action) {

    };

    $scope.onOpenCell = function() {

    };

    $scope.isValidAccess = function() {
      return !_.isEmpty($scope.panelData) && new Date($scope.panelData.validTill) > new Date();
    }
  }
]);