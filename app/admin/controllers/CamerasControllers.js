app.controller('CamerasListCtrl', ['$scope', 'Api', 'settings', '$filter', 'notify',
    function($scope, Api, settings, $filter, notify) {
        $scope.cameras = [];
        $scope.skip = 0;
        $scope.take = 20;
        $scope.loadedAllCameras = false;

        $scope.loadCameras = function(reset) {
            if (reset) $scope.skip = 0;
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

        $scope.deleteCamera = function(camera) {
            if (window.confirm($filter('translate')('NOTIFY_MESSAGE_CAMERA_DELETE_CONFIRM'))) {
                Api.post(settings.API_URL, {
                    'Action': 'DeleteCamera',
                    'CameraId': camera.id
                }, function () {
                    notify($filter('translate')('NOTIFY_CAMERA_DELETED'));
                    $scope.loadCameras(true);
                });
            }
        };
    }
]);
