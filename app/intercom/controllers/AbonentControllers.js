'use strict';

app.controller('AbonentListCtrl', ['$scope', 'Abonent', 'Address', 'AccessObject',
    function($scope, Abonent, Address, AccessObject) {
        $scope.filter = {};
        $scope.take = 20;
        $scope.objects = [];
        $scope.skip = 0;
        $scope.isLoadedAll = false;

        $scope.loadObjects = function(reset) {
            Abonent.query(angular.extend({skip: $scope.skip, take: $scope.take}, $scope.filter)).$promise.then(function(response){
                $scope.skip += response.items.length;

                if (reset) {
                    $scope.objects = response.items;
                }
                else {
                    $scope.objects.push.apply($scope.objects, response.items);
                }

                $scope.isLoadedAll = response.items.length < $scope.take;
            });
        };

        $scope.$watchCollection('filter', function(newVal, oldVal){
            if (newVal !== oldVal) {
                $scope.skip = 0;
                $scope.loadObjects(true);
            }
        });

        $scope.loadObjects();
    }
]);

app.controller('AbonentCreateCtrl', ['$scope', '$state', 'Abonent', 'Device',
    function($scope, $state, Abonent, Device) {
        $scope.abonent = new Abonent({
            cars: [],
            perimeters: [],
            temporaryAccessPerimeters: []
        });

        $scope.save = function() {
            $scope.abonent.$save().then(function(response) {
                $state.go('admin.abonent.list');
            });
        };

        $scope.devices = Device.query();
    }
]);

app.controller('AbonentDetailCtrl', ['$scope', '$controller', '$rootScope', '$state', '$stateParams', 'Abonent', 'AccessObject', 'notify', 'gettextCatalog',
    function($scope, $controller, $rootScope, $state, $stateParams, Abonent, AccessObject, notify, gettextCatalog) {

        if (!$stateParams.abonent) {
            $state.go('admin.abonent.list');
            return;
        }

        $scope.abonent = new Abonent(angular.copy($stateParams.abonent));
        
        $scope.save = function() {
            $scope.abonent.$save(function(response) {
                notify(gettextCatalog.getString('abonents.abonent_updated'));
                $state.current.showConfirmation = false;
                $state.go('admin.abonent.list');
            });
        };

        $scope.delete = function() {
            if (window.confirm(gettextCatalog.getString('abonents.abonent_delete_confirm'))) {
                $scope.abonent.$delete(function (response) {
                    notify(gettextCatalog.getString('abonents.abonent_deleted'));
                    $state.current.showConfirmation = false;
                    $state.go('admin.abonent.list');
                });
            }
        };

        $scope.deletePerimeterKey = function(object) {
            var index = $scope.abonent.perimeters.indexOf(object);
            $scope.abonent.perimeters.splice(index, 1);
        };

        $scope.deleteTemporaryPerimeterKey = function (object) {
            var index = $scope.abonent.temporaryAccessPerimeters.indexOf(object);
            $scope.abonent.temporaryAccessPerimeters.splice(index, 1);
        };

        $controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: $scope.abonent
        });
    }
]);
