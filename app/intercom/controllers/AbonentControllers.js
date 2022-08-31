'use strict';

app.controller('AbonentListCtrl', ['$scope', 'Abonent', 'gettextCatalog',
    function($scope, Abonent, gettextCatalog) {
        $scope.filter = {};
        $scope.take = 20;
        $scope.objects = [];
        $scope.skip = 0;
        $scope.isLoadedAll = false;
        $scope.importedFile = null;
        $scope.importInfoTitle = gettextCatalog.getString('importInfoTitle')

        $scope.loadObjects = function(reset) {
            Abonent.query(angular.extend({skip: $scope.skip, take: $scope.take}, $scope.filter)).$promise.then(function(response) {
                $scope.skip += response.items.length;
                $scope.$emit('updateAddresses');

                if (reset) {
                    $scope.objects = response.items;
                }
                else {
                    $scope.objects.push.apply($scope.objects, response.items);
                }

                $scope.isLoadedAll = response.items.length < $scope.take;
            });
        };

        $scope.$watchCollection('filter', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                $scope.skip = 0;
                $scope.loadObjects(true);
            }
        });
        $scope.$watchCollection('importedFile', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                const fd = new FormData();
                fd.append('file', newVal);
                $scope.skip = 0;
                Abonent.import(fd).$promise
                    .then(() => $scope.loadObjects(true));
            }
        });

        $scope.loadObjects();

        $scope.downloadTemplate = () => window.open(`assets/abonent-import-template_${$scope.language.active}.xlsx`, '_blank');

        $scope.user.updateKeyCountInfo();
    }
]);

app.controller('AbonentCreateCtrl', ['$scope', '$state', 'Abonent', 'Device',
    function($scope, $state, Abonent, Device) {
        $scope.showRfid = true;
        $scope.abonent = new Abonent({
            cars: [],
            perimeters: [],
            temporaryAccessPerimeters: []
        });

        Abonent.getStatusCreateAbonentUser().$promise.then(function (response) {
            $scope.createAbonentUser = response.status;
        });

        $scope.save = function() {
            $scope.abonent.$save().then(function(response) {
                $state.go('admin.abonent.list');
            });
        };

        $scope.devices = Device.query();
    }
]);

app.controller('AbonentDetailCtrl', ['$scope', '$controller', '$state', '$stateParams', 'Abonent', 'notify', 'gettextCatalog', 'User',
    function($scope, $controller, $state, $stateParams, Abonent, notify, gettextCatalog, User) {

        if (!$stateParams.abonent) {
            $state.go('admin.abonent.list');
            return;
        }

        $scope.abonent = new Abonent(angular.copy($stateParams.abonent));
        
        $scope.save = function() {
            $scope.abonent.$save(function(response) {
                notify(gettextCatalog.getString('abonents.abonent_updated'));
                $state.current.showConfirmation = false;
                User.updateKeyCountInfo();
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
