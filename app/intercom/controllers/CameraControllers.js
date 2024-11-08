'use strict';

app.controller('CameraListCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'Camera',
  function($scope, $http, $httpParamSerializer, settings, Camera) {
    $scope.take = 20;
    $scope.objects = [];
    $scope.skip = 0;
    $scope.isLoadedAll = false;

    $scope.loadCameras = function(reset) {
      Camera.query(angular.extend({skip: $scope.skip, take: $scope.take})).$promise.then(function(response) {
        $scope.skip += response.length;
        $scope.objects = $scope.objects.concat(response);
        $scope.isLoadedAll = response.length < $scope.take;
      });
    };

    $scope.loadCameras();
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

app.controller('CameraDetailCtrl', ['$scope', '$controller', '$http', '$state', '$stateParams', 'settings', 'Camera', 'notify', 'gettextCatalog',
  function ($scope, $controller, $http, $state, $stateParams, settings, Camera, notify, gettextCatalog) {
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

    $scope.showApplyMessageCall = function() {
      $scope.showApplyMessage = true;
      window.scrollTo(0,0);
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
