'use strict';

app.controller('SipDeviceListCtrl', ['$scope', 'settings', 'SipDevice', 'gettextCatalog', 'notify', 'Api',
  function ($scope, settings, SipDevice, gettextCatalog, notify, Api) {
    $scope.take = 20;
    $scope.skip = 0;
    $scope.sipDevices = [];
    $scope.isLoadedAll = false;
    $scope.selectedDevices = [];
    $scope.filter = {};

    $scope.loadSipDevices = function (reset) {
      const params = {
        skip: $scope.skip,
        take: $scope.take
      };
      if ($scope.filter.sipDeviceName) {
        params.sipDeviceName = $scope.filter.sipDeviceName;
      }
      SipDevice.query(params).$promise.then(function (response) {
        if (reset) {
          $scope.sipDevices = response;
          $scope.skip = response.length;
        } else {
          $scope.sipDevices = $scope.sipDevices.concat(response);
          $scope.skip     += response.length;
        }
        $scope.isLoadedAll = response.length < $scope.take;
      });
    };

    $scope.loadSipDevices();

    $scope.deleteSelected = function() {
      if (!confirm(gettextCatalog.getString('sipdevice.confirm_delete_selected'))) return;

      const toDelete = $scope.selectedDevices.slice();

      Promise.allSettled(
        toDelete.map(dev =>
          Api.post(settings.API_URL, {
            Action: 'UnregisterSipDevice',
            SipDeviceId: dev.sipDeviceId
          })
            .then(() => dev)
        )
      ).then(results => {
        const succeeded = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value);

        if (!succeeded.length) return;

        const ids = succeeded.map(dev => dev.sipDeviceId);

        $scope.sipDevices = $scope.sipDevices.filter(d => !ids.includes(d.sipDeviceId));
        $scope.selectedDevices = $scope.selectedDevices.filter(d => !ids.includes(d.sipDeviceId));

        notify(gettextCatalog.getString('sipdevice.devices_deleted'));
      });
    };

    $scope.$watch('filter', function (newVal, oldVal) {
      if (!angular.equals(newVal, oldVal)) {
        $scope.skip = 0;
        $scope.loadSipDevices(true);
      }
    }, true);

    $scope.isAllSelected = () =>
      $scope.sipDevices.length > 0 && $scope.selectedDevices.length === $scope.sipDevices.length;

    $scope.toggleAll = selectAll => {
      $scope.selectedDevices = selectAll
        ? [...$scope.sipDevices]
        : [];
    };

    $scope.toggleSelection = entry => {
      const idx = $scope.selectedDevices.findIndex(d => d.sipDeviceId === entry.sipDeviceId);
      if (idx > -1) $scope.selectedDevices.splice(idx, 1);
      else           $scope.selectedDevices.push(entry);
    };

    $scope.isSelected = entry =>
      $scope.selectedDevices.some(d => d.sipDeviceId === entry.sipDeviceId);
  }
]);

app.controller('SipDeviceCreateCtrl', ['$scope', 'settings', '$state', 'SipDevice', 'gettextCatalog', 'notify', 'Api',
  function ($scope, settings, $state, SipDevice, gettextCatalog, notify,  Api) {
    $scope.openMethods = [
      { value: 'api', name: 'api' },
      { value: 'dtmf', name: 'dtmf' },
    ];

    $scope.sipServers = [];
    $scope.loadSipServers = function () {
      Api.get(settings.API_URL, {
        Action: 'GetRegisteredSipServers'
      }).then(function (resp) {
        $scope.sipServers = resp.data;
      });
    };
    $scope.loadSipServers();

    $scope.isValid = function () {
      const nameValid = !!$scope.sipDevice.Name && $scope.sipDevice.Name.length <= 50;
      const descValid = !$scope.sipDevice.Description || $scope.sipDevice.Description.length <= 200;

      const openMethodValid = !!$scope.sipDevice.OpenMethod && $scope.sipDevice.OpenMethod !=="unknown";
      const dtmf = $scope.sipDevice.DtmfOpenCommand || "";
      const dtmfCommandValid = $scope.sipDevice.OpenMethod === 'dtmf'
        ? /^[0-9+*#]{1,10}$/.test(dtmf)
        : true;
      const serverValid  = !!$scope.sipDevice.SipServerId;
      const addressValid = !!$scope.sipDevice.AddressId;

      return nameValid
        && descValid
        && dtmfCommandValid
        && openMethodValid
        && serverValid
        && addressValid;
    };


    $scope.sipDevice = new SipDevice({
      OpenMethod: $scope.openMethods[0].value,
      isNew: true,
    });

    $scope.$watch('sipDevice.OpenMethod', function(newVal, oldVal){
      if (newVal !== "dtmf") {
        $scope.sipDevice.DtmfOpenCommand = ""
      }
    })

    $scope.save = function () {
      $scope.sipDevice.$save().then(function () {
        notify(gettextCatalog.getString('sipdevice.created'));
        $state.go('admin.sip_device.list');
      }).catch(e => $scope.sipDevice.isNew = true);
    };
  }
]);

app.controller('SipDeviceDetailCtrl', [
  '$scope', '$state', '$stateParams', 'settings', 'SipDevice', 'gettextCatalog', 'notify', 'Api', '$controller',
  function ($scope, $state, $stateParams, settings, SipDevice, gettextCatalog, notify, Api) {
    if (!$stateParams.sipDevice) {
      return $state.go('admin.sip_device.list');
    }

    $scope.openMethods = [
      { value: 'api', name: 'api' },
      { value: 'dtmf', name: 'dtmf' },
    ];

    $scope.sipServers = [];
    $scope.loadSipServers = function () {
      Api.get(settings.API_URL, {
        Action: 'GetRegisteredSipServers'
      }).then(function (resp) {
        $scope.sipServers = resp.data;
      });
    };
    $scope.loadSipServers();

    $scope.sipDevice = new SipDevice($stateParams.sipDevice);

    $scope.showApplyMessageCall = function () {
      $scope.showApplyMessage = true;
      window.scrollTo(0, 0);
    };

    $scope.save = function () {
      $scope.sipDevice.$save().then(function () {
        notify(gettextCatalog.getString('sipdevice.updated'));
        $state.go('admin.sip_device.list');
      });
    };

    $scope.delete = function () {
      if (!window.confirm(gettextCatalog.getString('sipdevice.confirm_delete'))) return;
      $scope.sipDevice.$delete().then(function () {
        notify(gettextCatalog.getString('sipdevice.deleted'));
        $state.go('admin.sip_device.list');
      });
    };

    $scope.isValid = function () {
      const nameValid = !!$scope.sipDevice.Name && $scope.sipDevice.Name.length <= 50;
      const descValid = !$scope.sipDevice.Description || $scope.sipDevice.Description.length <= 200;

      const openMethodValid = !!$scope.sipDevice.OpenMethod && $scope.sipDevice.OpenMethod !=="unknown";
      const dtmf = $scope.sipDevice.DtmfOpenCommand || "";
      const dtmfCommandValid = $scope.sipDevice.OpenMethod === 'dtmf'
        ? /^[0-9+*#]{1,10}$/.test(dtmf)
        : true;
      const serverValid  = !!$scope.sipDevice.SipServerId;
      const addressValid = !!$scope.sipDevice.AddressId;

      return nameValid
        && descValid
        && dtmfCommandValid
        && openMethodValid
        && serverValid
        && addressValid;
    };


    $scope.onApply = function () {
      $scope.showApplyMessage = false;
      $scope.save();
    };
  }
]);
