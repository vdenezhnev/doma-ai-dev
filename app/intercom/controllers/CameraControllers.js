'use strict';

app.controller('CameraListCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'Camera', 'gettextCatalog', 'notify', 'Api',
  function ($scope, $http, $httpParamSerializer, settings, Camera, gettextCatalog, notify, Api) {
    $scope.take = 20;
    $scope.cameras = [];
    $scope.skip = 0;
    $scope.isLoadedAll = false;
    $scope.selectedCameras = [];
    $scope.filter = {}

    $scope.loadCameras = function (reset) {
      const params = {
        skip: $scope.skip,
        take: $scope.take
      }
      if ($scope.filter.name) params.name = $scope.filter.name;

      Camera.query(angular.extend(params)).$promise.then(function (response) {
        $scope.skip += response.length;

        if (reset) {
          $scope.cameras = response;
          $scope.skip = 0;
        } else {
          $scope.cameras = $scope.cameras.concat(response);
        }

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


    $scope.deleteSelected = function () {
      if (window.confirm(gettextCatalog.getString('camera.confirm_delete_selected'))) {
        const deletePromises = $scope.selectedCameras.map(camera =>
          Api.post(settings.API_URL, {
            'Action': 'DeleteCamera',
            'CameraId': camera.id
          })
        );

        Promise.all(deletePromises).then(results => {
          $scope.loadCameras(true);
          notify(gettextCatalog.getString('camera.cameras_deleted'));
          $scope.selectedCameras = [];
        });
      }
    };

    $scope.$watch('filter', function (newVal, oldVal) {
      if (!angular.equals(newVal, oldVal)) {
        $scope.skip = 0;
        $scope.loadCameras(true);
      }
    }, true);

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

    var loginRegex = /^(rtsp:\/\/)(?:([^:@]+)(?::([^:@]+))?@)?(.*)$/;

    var updatingFromUrl = false;
    var updatingFromFields = false;

    $scope.$watch('camera.CameraIp', function (newVal) {
      if (updatingFromFields || !newVal) return;

      var match = newVal.match(loginRegex);
      if (match) {
        updatingFromUrl = true;
        $scope.camera.Login = match[2] || '';
        $scope.camera.Password = match[3] || '';
        updatingFromUrl = false;
      }
    });

    $scope.$watchGroup(['camera.Login', 'camera.Password'], function (newValues) {
      if (updatingFromUrl) return;

      var currentUrl = $scope.camera.CameraIp;
      if (!currentUrl) return; // Nothing to update

      var match = currentUrl.match(loginRegex);
      if (match) {
        var protocol = match[1];
        var host = match[4] || '';
        var loginField = newValues[0] || '';
        var passwordField = newValues[1] || '';

        var credentials = '';
        if (loginField !== '') {
          if (passwordField !== '') {
            credentials = loginField + ':' + passwordField + '@';
          } else {
            credentials = loginField + '@';
          }
        }

        var newUrl = protocol + credentials + host;
        if (newUrl === currentUrl) return;

        updatingFromFields = true;
        $scope.camera.CameraIp = newUrl;
        updatingFromFields = false;
      }
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

    var loginRegex = /^(rtsp:\/\/)(?:([^:@]+)(?::([^:@]+))?@)?(.*)$/;

    var updatingFromUrl = false;
    var updatingFromFields = false;

    $scope.$watch('camera.CameraIp', function (newVal) {
      if (updatingFromFields || !newVal) return;

      var match = newVal.match(loginRegex);
      if (match) {
        updatingFromUrl = true;
        $scope.camera.Login = match[2] || '';
        $scope.camera.Password = match[3] || '';
        updatingFromUrl = false;
      }
    });

    $scope.$watchGroup(['camera.Login', 'camera.Password'], function (newValues) {
      if (updatingFromUrl) return;

      var currentUrl = $scope.camera.CameraIp;
      if (!currentUrl) return; // Nothing to update

      var match = currentUrl.match(loginRegex);
      if (match) {
        var protocol = match[1];
        var host = match[4] || '';
        var loginField = newValues[0] || '';
        var passwordField = newValues[1] || '';

        var credentials = '';
        if (loginField !== '') {
          if (passwordField !== '') {
            credentials = loginField + ':' + passwordField + '@';
          } else {
            credentials = loginField + '@';
          }
        }

        var newUrl = protocol + credentials + host;
        if (newUrl === currentUrl) return;

        updatingFromFields = true;
        $scope.camera.CameraIp = newUrl;
        updatingFromFields = false;
      }
    });

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

