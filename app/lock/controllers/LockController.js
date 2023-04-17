'use strict';

app.controller('LockCtrl', ['$scope', '$stateParams', '$state', '$http', '$filter', 'settings', 'notify', 'ModalService',
  function ($scope, $stateParams, $state, $http, $filter, settings, notify, ModalService) {
    if (!$stateParams.locks || !$stateParams.uuid || !$stateParams.online_server) {
      $state.go('lock.404');
    }

    $scope.locks = $stateParams.locks.split(',').map(function (l) {
      return {
        LockID: l,
        Status: false,
        LockOpen: false,
        isLoaded: false
      }
    });

    $scope.uuid = $stateParams.uuid;

    $scope.online_server = $stateParams.online_server;

    var prelocks = $stateParams.locks.split(',');

    for (var i = 0; i < prelocks.length; i++) {
      let lock = prelocks[i]
      fetch(`https://${$stateParams.online_server}/lockauth?lock=${lock}&uuid=${$stateParams.uuid}`)
        .then(function (data) {
          return data.json();
        })
        .then(function (data) {
          getStatus(lock, data.Token)
        })
        .catch(function () {
          getStatus(lock, '')
        });
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
    $scope.isNotLoaded = function (lock) {
      return lock.isLoaded === false;
    }
    $scope.isConnected = function (lock) {
      return lock.Connected === true;
    }
    $scope.isDoorOpen = function (lock) {
      return lock.DoorOpen === true;
    }

    function getStatus(lock, token) {
      var eventSource = new EventSource(`https://${$stateParams.online_server}/lockstate?lock=${lock}&uuid=${$stateParams.uuid}&token=${token}`);

      eventSource.onopen = function () {
        var eventLock = $scope.locks.find(function (e) {
          return e.LockID === lock;
        });
        eventLock.isLoaded = true;
        $scope.$apply();
      }

      eventSource.onmessage = function (event) {
        var lockState = JSON.parse(event.data);
        var eventLock = $scope.locks.find(function (e) {
          return e.LockID === lockState.LockID;
        });


        if (!(lockState.Status === undefined && lockState.LockOpen === undefined)) {
          if (lockState.Status !== undefined) {
            eventLock.Status = lockState.Status;
          }
          if (lockState.LockOpen !== undefined) {
            eventLock.LockOpen = lockState.LockOpen;
          }
          $scope.$apply();
        }

      };
      eventSource.onerror = function () {
        var eventLock = $scope.locks.find(function (e) {
          return e.LockID === lock;
        });
        if (eventLock !== undefined) {
          eventLock.Status = false;
          eventLock.LockOpen = false;
        }
        eventLock.isLoaded = true;
        $scope.$apply();
      };
    }
  }
]);