app.controller('CamerasListCtrl', ['$scope', 'Api', 'settings', '$filter', 'notify',
  function ($scope, Api, settings, $filter, notify) {
    $scope.cameras = [];
    $scope.skip = 0;
    $scope.take = 20;
    $scope.loadedAllCameras = false;
    $scope.selectedCameras = [];
    $scope.filter = {}

    $scope.loadCameras = function (reset) {
      if (reset) $scope.skip = 0;
      var request = {
        'Action': "GetCameras",
        'Skip': $scope.skip,
        'Take': $scope.take,
      };

      if ($scope.filter.name) request.name = $scope.filter.name;
      if ($scope.filter.serviceCompanyName) request.serviceCompanyName = $scope.filter.serviceCompanyName;

      Api.get(settings.API_URL, request, function (response) {
        $scope.skip += response.data.length;

        if (reset) {
          $scope.cameras = response.data;
        } else {
          $scope.cameras.push.apply($scope.cameras, response.data);
        }

        $scope.loadedAllCameras = response.data.length < $scope.take;
      });
    };

    $scope.loadCameras();

    $scope.deleteCamera = function (camera) {
      if (window.confirm($filter('translate')('NOTIFY_MESSAGE_CAMERA_DELETE_CONFIRM'))) {
        Api.post(settings.API_URL, {
          'Action': 'DeleteCamera',
          'CameraId': camera.id
        }, function () {
          notify($filter('translate')('NOTIFY_CAMERA_DELETED'));
          $scope.loadCameras(true);
        });
      }
    };

    $scope.checkStatus = function() {
      const statusPromises = $scope.selectedCameras.map(camera =>
        Api.get(settings.API_URL, {
          'Action': 'CheckCameraStatus',
          'CameraId': camera.id
        }).then(response => {
          const updatedCamera = $scope.cameras.find(c => c.id === camera.id);
          if (updatedCamera) {
            updatedCamera.online = response.data.online;
          }
        }).catch(error => {
          console.error(`Failed to fetch status for Camera ID ${camera.id}:`, error);
        })
      );

      Promise.all(statusPromises).then(results => {
        notify($filter('translate')('NOTIFY_CAMERA_STATUS_UPDATED'));
      });
    };


    $scope.isAllSelected = function () {
      return $scope.cameras.length > 0 && $scope.selectedCameras.length === $scope.cameras.length;
    };

    $scope.toggleAllCameras = function (selectAll) {
      if (selectAll) {
        $scope.selectedCameras = [...$scope.cameras];
      } else {
        $scope.selectedCameras = [];
      }
    };

    $scope.toggleSelection = function (entry) {
      const index = $scope.selectedCameras.findIndex(e => e.id === entry.id);
      if (index > -1) {
        $scope.selectedCameras.splice(index, 1);
      } else {
        $scope.selectedCameras.push(entry);
      }
    };

    $scope.$watch('filter', function (newVal, oldVal) {
      if (!angular.equals(newVal, oldVal)) {
        $scope.skip = 0;
        $scope.loadCameras(true);
      }
    }, true);

    $scope.isSelected = function (entry) {
      return $scope.selectedCameras.some(e => e.id === entry.id);
    };
  }
]);
