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

app.controller('PostamatDetailCtrl', ['$scope', '$state', '$stateParams', 'Api', 'settings', 'notify', '$filter',
    function($scope, $state, $stateParams, Api, settings, notify, $filter) {
        if (!$stateParams.postamat) {
            $state.go('admin.postamates.list');
        }

        $scope.postamat = $stateParams.postamat;
        $scope.isCreate = false;

        $scope.save = function() {
            var data = angular.extend({Action: 'UpdatePostamat'}, angular.copy($scope.postamat));
            Api.post(settings.API_URL, data, function(response) {
                notify($filter('translate')('NOTIFY_POSTAMAT_UPDATED'));
                $state.go('admin.postamates.detail', {id: response.data.id, postamat: response.data});
            });
        };

        $scope.delete = function() {
            if (window.confirm($filter('translate')('NOTIFY_MESSAGE_POSTAMAT_DELETE_CONFIRM'))) {
                Api.post(settings.API_URL, {
                    'Action': 'DeletePostamat',
                    'id': $scope.postamat.id
                }, function () {
                    notify($filter('translate')('NOTIFY_POSTAMAT_DELETED'));
                    $state.go('admin.postamates.list');
                });
            }
        };
    }
]);

app.controller('PostamatCreateCtrl', ['$scope', '$state', 'Api', 'settings', 'notify', '$filter',
    function($scope, $state, Api, settings, notify, $filter) {
        $scope.isCreate = true;

        $scope.postamat = {
            id: '',
            pid: '',
            cellCount: 0,
            rtspAddress: ''
        };

        $scope.save = function() {
            var data = angular.copy($scope.postamat);
            Api.post(settings.API_URL, angular.extend({Action: 'CreatePostamat'}, data), function(response) {
                notify($filter('translate')('NOTIFY_POSTAMAT_ADDED'));
                $state.go('admin.postamates.detail', {id: response.data.id, postamat: response.data});
            });
        };
    }
]);