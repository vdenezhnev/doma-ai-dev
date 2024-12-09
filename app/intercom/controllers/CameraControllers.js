'use strict';

app.controller('CameraListCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'Camera', 'gettextCatalog', 'notify', 'Api',
  function ($scope, $http, $httpParamSerializer, settings, Camera, gettextCatalog, notify, Api) {
    $scope.take = 20;
    $scope.cameras = [];
    $scope.skip = 0;
    $scope.isLoadedAll = false;
    $scope.selectedCameras = [];

    $scope.loadCameras = function (reset) {
      Camera.query(angular.extend({ skip: $scope.skip, take: $scope.take })).$promise.then(function (response) {
        $scope.skip += response.length;
        $scope.cameras = $scope.cameras.concat(response);
        $scope.isLoadedAll = response.length < $scope.take;
      });
    };

    $scope.loadCameras();


    $scope.checkStatus = function () {
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
        notify(gettextCatalog.getString('camera.status_updated'));
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

    $scope.isSelected = function (entry) {
      return $scope.selectedCameras.some(e => e.id === entry.id);
    };
  }
]);

app.controller('CameraCreateCtrl', ['$scope', '$http', '$state', 'Camera', 'gettextCatalog', 'notify',
  function ($scope, $http, $state, Camera, gettextCatalog, notify) {
    $scope.camera = new Camera({
      isNew: true,
    });

    $scope.save = function () {
      $scope.camera.$save().then(function (response) {
        notify(gettextCatalog.getString('camera.camera_created'));
        $state.go('admin.camera.list');
      });
    };
  }
]);

app.controller('CameraDetailCtrl', ['$scope', '$controller', '$http', '$state', '$stateParams', 'settings', 'Camera', 'notify', 'gettextCatalog', 'Api',
  function ($scope, $controller, $http, $state, $stateParams, settings, Camera, notify, gettextCatalog, Api) {
    if (!$stateParams.camera) {
      return $state.go('admin.camera.list');
    }

    $scope.camera = new Camera($stateParams.camera);

    $scope.save = function () {
      $scope.camera.$save().then(function (response) {
        $state.current.showConfirmation = false;
        notify(gettextCatalog.getString('camera.camera_updated'));
        $state.go('admin.camera.list');
      });
    };

    $scope.showApplyMessageCall = function () {
      $scope.showApplyMessage = true;
      window.scrollTo(0, 0);
    };

    $scope.checkStatus = function () {
      Api.get(settings.API_URL, {
        'Action': 'CheckCameraStatus',
        'CameraId': $scope.camera.CameraId
      }).then(response => {
        $scope.camera.online = response.data.online;
        notify(gettextCatalog.getString('camera.status_updated'));
      }).catch(error => {
        console.error(`Failed to fetch status for Camera ID ${$scope.camera.CameraId}:`, error);
      });
    };

    $scope.delete = function () {
      if (window.confirm(gettextCatalog.getString('cameras.camera_delete_confirm'))) {
        $scope.camera.$delete(function (response) {
          $state.current.showConfirmation = false;
          notify(gettextCatalog.getString('camera.camera_deleted'));
          $state.go('admin.camera.list');
        });
      }
    };

    $controller('ObjectWatchChangesCtrl', {
      $scope: $scope,
      $state: $state,
      object: $scope.camera
    });
  }
]);
