
app.controller('DeviceListCtrl', ['$scope', '$http', 'Device', function($scope, $http, Device) {
    $scope.loadedAllDevices = false;
    $scope.skip = 0;
    $scope.devices = [];

    $scope.loadDevices = function () {
        Device.query({Skip: $scope.skip, Take: 20}, function (response) {
            $scope.devices = $scope.devices.concat(response);
            if (response.length < 20) {
                $scope.loadedAllDevices = true;
            }
            $scope.skip += response.length;
        });
    };

    $scope.loadDevices();

}]);

app.controller('DeviceCreateCtrl', ['$scope', '$http', '$state', 'Device',
    function($scope, $http, $state, Device) {
        $scope.device = new Device({
            isNew: true
        });

        $scope.save = function() {
            $scope.device.$save().then(function(response) {
                $state.go('admin.device.list');
            });
        };
    }
]);

app.controller('DeviceDetailCtrl', ['$scope', '$controller', '$http', '$state', '$stateParams', 'Device', 'notify', 'gettextCatalog',
    function($scope, $controller, $http, $state, $stateParams, Device, notify, gettextCatalog) {
        if (!$stateParams.device) {
            return $state.go('admin.device.list');
        }

        $scope.device = new Device($stateParams.device);

        $scope.save = function() {
            $scope.device.$save().then(function(response) {
                notify(gettextCatalog.getString('devices.device_updated'));
                $state.go('admin.device.list');
            });
        };

        $scope.delete = function() {
            if (window.confirm(gettextCatalog.getString('devices.device_delete_confirm'))) {
                $scope.device.$delete(function(response) {
                    notify(gettextCatalog.getString('devices.device_deleted'));
                    $state.go('admin.device.list');
                });
            }
        };

        $controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: $scope.device
        });
    }
]);
