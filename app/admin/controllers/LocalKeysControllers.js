'use strict';

app.controller('LocalKeysListCtrl', ['$scope', 'Api', 'settings',
    function($scope, Api, settings) {
        $scope.keys = [];
        $scope.skip = 0;
        $scope.loadedAllKeys = false;
        $scope.listFilter = {
            keyDate: {
                from: null,
                to: null
            }
        };

        $scope.loadKeys = function(take, reset, filter) {
            var action = ($scope.q || filter) ? 'SearchEcryptedKeys' : 'GetLatestRegisteredEncryptedKeys';
            var request = {
                'Action': action,
                'Skip': $scope.skip,
                'Take': take,
                'SearchPhrase': $scope.q
            };

            if (filter) {
                request.createDateTo = filter.keyDate.to;
                request.createDateFrom = filter.keyDate.from;
            }

            Api.get(settings.API_URL, request, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.keys = response.data;
                }
                else {
                    $scope.keys.push.apply($scope.keys, response.data);
                }

                $scope.loadedAllKeys = response.data.length < take;
            });

        };

        $scope.resetFilter = function () {
            $scope.listFilter.keyDate.to = null;
            $scope.listFilter.keyDate.from = null;
        }

        $scope.$watch('q', function(newVal, oldVal){
            if (newVal != oldVal) {
                $scope.skip = 0;
                $scope.loadKeys(20, true, $scope.listFilter);
            }
        });

        $scope.$watch('listFilter', function(newVal, oldVal){
            if (!angular.equals(newVal, oldVal)) {
                $scope.skip = 0;
                $scope.loadKeys(20, true, newVal);
            }
        }, true);

        $scope.loadKeys(20, false);
    }
]);