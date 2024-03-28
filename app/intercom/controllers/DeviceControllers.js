app.controller('DeviceListCtrl', ['$scope', '$http', 'Device', function ($scope, $http, Device) {
  $scope.loadedAllDevices = false;
  $scope.skip = 0;
  $scope.devices = [];

  $scope.loadDevices = function () {
    Device.query({ Skip: $scope.skip, Take: 100 }, function (response) {
      $scope.devices = $scope.devices.concat(response);
      if (response.length < 100) {
        $scope.loadedAllDevices = true;
      }
      $scope.skip += response.length;
    });
  };

  $scope.loadDevices();

}]);

app.controller('DeviceCreateCtrl', ['$scope', '$http', '$state', 'Device',
  function ($scope, $http, $state, Device) {
    $scope.device = new Device({
      isNew: true
    });

    $scope.save = function () {
      $scope.device.$save().then(function (response) {
        $state.go('admin.device.list');
      });
    };
  }
]);

app.controller('DeviceDetailCtrl', ['$scope', '$controller', '$http', '$state', '$stateParams', 'settings', 'Device', 'notify', 'gettextCatalog',
  function ($scope, $controller, $http, $state, $stateParams, settings, Device, notify, gettextCatalog) {
    if (!$stateParams.device) {
      return $state.go('admin.device.list');
    }

    $scope.device = new Device($stateParams.device);

    $scope.save = function () {
      $scope.device.$save().then(function (response) {
        notify(gettextCatalog.getString('devices.device_updated'));
        $state.go('admin.device.list');
      });
    };

    $scope.delete = function () {
      if (window.confirm(gettextCatalog.getString('devices.device_delete_confirm'))) {
        $scope.device.$delete(function (response) {
          notify(gettextCatalog.getString('devices.device_deleted'));
          $state.go('admin.device.list');
        });
      }
    };

    $scope.lock = {
      LockID: "LZMC2XI53IARBYY",
      Status: false,
      LockOpen: false,
      isLoaded: false
    }

    $scope.uuid = "11111111-2222-3333-0000-000000000000";

    $scope.online_server = "online.smartairkey.com:6443";

    fetch(`https://${$scope.online_server}/lockauth?lock=LZMC2XI53IARBYY&uuid=11111111-2222-3333-0000-000000000000`)
      .then(function (data) {
        return data.json();
      })
      .then(function (data) {
        getStatus(lock, data.Token)
      })
      .catch(function () {
        getStatus(lock, '')
      });
    getStatus('')
    $scope.isAvailable = function () {
      return $scope.lock.Status === 'Online';
    };
    $scope.isOpen = function () {
      return $scope.lock.LockOpen === true;
    }
    $scope.isNotLoaded = function () {
      return $scope.lock.isLoaded === false;
    }
    $scope.lockIsConnected = function () {
      return $scope.lock.Connected === true;
    }
    $scope.isDoorOpen = function () {
      return $scope.lock.DoorOpen === true;
    }

    function getStatus(token) {
      var eventSource = new EventSource(`https://${$scope.online_server}/lockstate?lock=${$scope.lock.LockID}&uuid=${$scope.uuid}&token=${token}`);

      eventSource.onopen = function () {
        $scope.lock.isLoaded = true;
        $scope.$apply();
      }

      eventSource.onmessage = function (event) {
        var lockState = JSON.parse(event.data);
        if (!(lockState.Status === undefined && lockState.LockOpen === undefined)) {
          if (lockState.Status !== undefined) {
            $scope.lock.Status = lockState.Status;
          }
          if (lockState.Connected !== undefined) {
            $scope.lock.Connected = lockState.Connected;
          }
          if (lockState.LockOpen !== undefined) {
            $scope.lock.LockOpen = lockState.LockOpen;
          }
          $scope.$apply();
        }

      };
      eventSource.onerror = function () {

        if ($scope.lock !== undefined) {
          $scope.lock.Status = false;
          $scope.lock.LockOpen = false;
        }
        $scope.lock.isLoaded = true;
        $scope.$apply();
      };
    }

    $controller('ObjectWatchChangesCtrl', {
      $scope: $scope,
      $state: $state,
      object: $scope.device
    });
  }
]);
