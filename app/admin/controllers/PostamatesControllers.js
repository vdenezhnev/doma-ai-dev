'use strict';

app.controller('PostamatesListCtrl', ['$scope', 'Api', 'settings',
    function($scope, Api, settings) {
        $scope.postamates = [];
        $scope.skip = 0;
        $scope.loadedAllPostamates = false;

        $scope.loadPostamates = function(take, reset, filter) {
            var action = ($scope.q || filter) ? 'SearchPostamates' : 'GetLatestRegisteredPostamates';
            var request = {
                'Action': action,
                'Skip': $scope.skip,
                'Take': take,
                'SearchPhrase': $scope.q
            };

            Api.get(settings.API_URL, request, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.postamates = response.data;
                }
                else {
                    $scope.postamates.push.apply($scope.postamates, response.data);
                }

                $scope.loadedAllPostamates = response.data.length < take;
            });

        };

        $scope.$watch('q', function(newVal, oldVal){
            if (newVal != oldVal) {
                $scope.skip = 0;
                $scope.loadPostamates(20, true, $scope.listFilter);
            }
        });

        $scope.loadPostamates(20, false);
    }
]);