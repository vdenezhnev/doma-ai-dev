
app.controller('TariffListCtrl', ['$scope', '$http', 'Tariff',
    function($scope, $http, Tariff) {
        $scope.tariffs = Tariff.query({Skip: 0, Take: 100});
    }
]);

app.controller('TariffCreateCtrl', ['$rootScope', '$scope', '$http', '$state', 'Tariff',
    function($rootScope, $scope, $http, $state, Tariff) {
        $scope.tariff = new Tariff({
            tariffPacket: {
                subscriptions: [{
                    type: 'monthly',
                    dateOfPayment: 'FirstDayOfMonth',
                    price: {
                        currency: $rootScope.currency
                    },
                    additionalKeyPrice: {
                        currency: $rootScope.currency
                    }
                }, {
                    type: 'yearly',
                    dateOfPayment: 'WhenPeriodExpires',
                    price: {
                        currency: $rootScope.currency
                    },
                    additionalKeyPrice: {
                        currency: $rootScope.currency
                    }
                }]
            }
        });

        $scope.tariffTypes = ['access', 'serviceCompany'];

        $scope.save = function() {
            $scope.tariff.$save().then(function(response) {
                $scope.$emit('updateTariffs');
                $state.go('admin.tariff.list');
            });
        };
    }
]);

app.controller('TariffDetailCtrl', ['$scope', '$controller', '$http', '$state', 'notify', 'Tariff', 'gettextCatalog', 'tariff',
    function($scope, $controller, $http, $state, notify, Tariff, gettextCatalog, tariff) {
        $scope.tariff = tariff;

        $scope.save = function() {
            $scope.tariff.$save(function(response){
                notify(gettextCatalog.getString('tariffs.tariff_updated'));
                $scope.$emit('updateTariffs');
                $state.go('admin.tariff.detail', {id: $scope.tariff.id, revision: $scope.tariff.appliedRevision});
            });
        };

        $scope.apply = function(notify) {
            Tariff.apply({
                id: $scope.tariff.id,
                notifyAbonents: notify == true
            }).$promise.then(function(result) {
                notify(gettextCatalog.getString('tariffs.tariff_applied'));
            });
        };

        $scope.showApplyMessageCall = function() {
            $scope.showApplyMessage = true;
            window.scrollTo(0,0);
        };

        $scope.rollback = function() {
            Tariff.rollback({id: $scope.tariff.id, revision: $scope.tariff.appliedRevision}).$promise.then(function(result) {
                notify(gettextCatalog.getString('tariffs.tariff_rollbacked'));
                $state.go('admin.tariff.detail', {id: $scope.tariff.id, revision: $scope.tariff.appliedRevision});
            });
        };
    }
]);
