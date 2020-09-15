'use strict';

app.controller('AccessPointListCtrl', ['$scope', 'Api', 'settings',
    function($scope, Api, settings) {
        $scope.objects = [];
        $scope.skip = 0;
        $scope.loadedAll = false;

        $scope.loadObjects = function(take, reset) {
            var action = $scope.q ? 'SearchAccessPoints' : 'GetLatestRegisteredAccessPoints';
            Api.get(settings.API_URL, {
                'Action': action,
                'Skip': $scope.skip,
                'Take': take,
                'SearchPhrase': $scope.q
            }, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.objects = response.data;
                }
                else {
                    $scope.objects.push.apply($scope.objects, response.data);
                }

                $scope.loadedAll = response.data.length < take;
            });
        };

        $scope.$watch('q', function(newVal, oldVal){
            if (newVal !== oldVal) {
                $scope.skip = 0;
                $scope.loadObjects(20, true);
            }
        });

        $scope.loadObjects(20, false);
    }
]);
