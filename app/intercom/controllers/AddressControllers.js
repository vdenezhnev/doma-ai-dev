'use strict';

app.controller('AddressListCtrl', ['$scope', 'Address',
    function($scope, Address) {
        $scope.addresses = Address.query();
    }
]);

app.controller('AddressCreateCtrl', ['$scope', '$state', 'Address', 'notify', 'gettextCatalog',
    function($scope, $state, Address, notify, gettextCatalog) {
        $scope.address = new Address();

        $scope.save = function() {
            $scope.address.$save().then(function() {
                notify(gettextCatalog.getString('notify.addresses.created'));
                $state.current.showConfirmation = false;
                $scope.$emit('updateAddresses');
                $state.go('admin.address.list');
            });
        };
    }
]);

app.controller('AddressDetailCtrl', ['$scope', '$controller', '$state', '$stateParams', 'notify', 'gettextCatalog', 'Address',
    function($scope, $controller, $state, $stateParams, notify, gettextCatalog, Address) {

        if (!$stateParams.address) {
            $state.go('admin.address.list');
        }

        $scope.address = new Address($stateParams.address);
        $scope.title = $scope.address.value;

        $scope.save = function() {
            $scope.address.$save(function(){
                notify(gettextCatalog.getString('notify.addresses.updated'));
                $state.current.showConfirmation = false;
                $scope.$emit('updateAddresses');
                $state.go('admin.address.list');
            });
        };

        $controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: $scope.address
        });
    }
]);
