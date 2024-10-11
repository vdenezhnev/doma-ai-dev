app.controller('CamerasListCtrl', ['$scope', 'Api', 'settings',
    function($scope, Api, settings) {
        $scope.cameras = [];
        $scope.skip = 0;
        $scope.take = 20;
        $scope.loadedAllCameras = false;

        $scope.loadCameras = function(reset) {
            var request = {
                'Action': "GetCameras",
                'Skip': $scope.skip,
                'Take': $scope.take,
            };

            Api.get(settings.API_URL, request, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.cameras = response.data;
                }
                else {
                    $scope.cameras.push.apply($scope.cameras, response.data);
                }

                $scope.loadedAllCameras = response.data.length < $scope.take;
            });

        };

        $scope.loadCameras();
    }
]);
