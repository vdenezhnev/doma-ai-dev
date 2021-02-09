
app.controller('AccessRightListCtrl', ['$scope', '$state', 'Abonent', 'AccessRight',
    function($scope, $state, Abonent, AccessRight) {
        $scope.objects = [];
        $scope.canLoadMode = false;

        $scope.filter = {
            Take: 20,
            Skip: 0
        };

        $scope.loadObjects = function(reset) {
            var filter = angular.extend(angular.copy($scope.filter), {
                Skip: 0
            });

            AccessRight.query(filter, function (response) {
                $scope.objects = response.items;
                $scope.canLoadMode = response.items.length === $scope.filter.Take;
            });
        };

        $scope.loadMore = function() {
            if ($scope.canLoadMode) {
                var filter = angular.extend(angular.copy($scope.filter), {
                    Skip: $scope.objects.length
                });

                AccessRight.query(filter, function (response) {
                    $scope.objects = $scope.objects.concat(response.items);
                    $scope.canLoadMode = response.items.length >= $scope.filter.Take;
                });
            }
        };

        $scope.$watchCollection('filter', function () {
            $scope.loadObjects();
        });

        $scope.openDetails = function (obj) {
            if (!$scope.hasAccess('user')) {
                return;
            }

            Abonent.query({skip: 0, take: 20, phoneNumber: obj.userPhoneNumber}, function (response) {
                if (response.items.length > 0) {
                    var abonent = response.items[0];
                    return $state.go('admin.abonent.detail', {id: abonent.id, abonent: abonent});
                }
            });
        };
    }
]);
