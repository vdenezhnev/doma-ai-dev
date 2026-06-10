
app.controller('AccessRightListCtrl', ['$scope', '$state', 'Abonent', 'AccessRight',
    function($scope, $state, Abonent, AccessRight) {
        $scope.objects = [];
        $scope.canLoadMode = false;

        $scope.filter = {
            Take: 20,
            Skip: 0
        };

        $scope.getAccessRightCards = function (item) {
            if (!item) {
                return [];
            }

            var seen = {};
            var cards = [];

            function pushCard(value) {
                if (value == null || value === '') {
                    return;
                }

                var key = String(value).trim();
                if (!key || seen[key]) {
                    return;
                }

                seen[key] = true;
                cards.push(key);
            }

            if (item.pacsCodes && item.pacsCodes.length) {
                angular.forEach(item.pacsCodes, function (code) {
                    pushCard(code.value);
                });
            }

            pushCard(item.externalId);
            pushCard(item.tagId);

            return cards;
        };

        $scope.enrichAccessRightCards = function (item) {
            item.cardList = $scope.getAccessRightCards(item);
            return item;
        };

        $scope.buildSearchParams = function (filter) {
            var params = angular.extend({}, filter);
            var cardNumber = params.cardNumber;
            delete params.cardNumber;

            if (cardNumber) {
                var normalized = String(cardNumber).trim().replace(/[\s-]/g, '');
                if (normalized && /^[0-9a-fA-F]+$/.test(normalized)) {
                    params.PacsCode = /[a-fA-F]/.test(normalized) ? normalized.toUpperCase() : normalized;
                }
            }

            return params;
        };

        $scope.loadObjects = function(reset) {
            var filter = $scope.buildSearchParams(angular.extend(angular.copy($scope.filter), {
                Skip: 0
            }));

            AccessRight.query(filter, function (response) {
                $scope.objects = (response.items || []).map($scope.enrichAccessRightCards);
                $scope.canLoadMode = response.items.length === $scope.filter.Take;
            });
        };

        $scope.loadMore = function() {
            if ($scope.canLoadMode) {
                var filter = $scope.buildSearchParams(angular.extend(angular.copy($scope.filter), {
                    Skip: $scope.objects.length
                }));

                AccessRight.query(filter, function (response) {
                    var items = (response.items || []).map($scope.enrichAccessRightCards);
                    $scope.objects = $scope.objects.concat(items);
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
