'use strict';

app.controller('JournalListCtrl', ['$scope', '$http', 'Journal',
    function($scope, $http, Journal) {

        $scope.filter = {
            Take: 25,
            Skip: 0,
            From: moment().subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss'),
            Till: moment().format('YYYY-MM-DDTHH:mm:ss')
        };
        $scope.total = 0;
        $scope.canLoadMode = false;
        $scope.journals = [];

        function modify_filter(filter) {
            if (filter.From) {
                filter.From = moment(filter.From).startOf('date').format('YYYY-MM-DDTHH:mm:ss');
            }

            if (filter.Till) {
                filter.Till = moment(filter.Till).endOf('date').format('YYYY-MM-DDTHH:mm:ss');
            }

            return filter;
        }

        $scope.loadMore = function() {
            if ($scope.canLoadMode) {
                var filter = angular.extend(angular.copy($scope.filter), {
                    Skip: $scope.journals.length
                });
                filter = modify_filter(filter);

                Journal.query(filter, function (response) {
                    $scope.journals = $scope.journals.concat(response.records);
                    $scope.canLoadMode = $scope.journals.length < $scope.total;
                });
            }
        };

        $scope.loadJournal = function() {
            var filter = angular.extend(angular.copy($scope.filter), {
                Skip: 0
            });
            filter = modify_filter(filter);

            Journal.query(filter, function (response) {
                $scope.journals = response.records;
                $scope.total = response.total;
                $scope.canLoadMode = $scope.journals.length < $scope.total;
            });
        };

        $scope.resetDateFilter = function () {
            $scope.filter.From = undefined;
            $scope.filter.Till = undefined;
        };

        $scope.$watchCollection('filter', function () {
            $scope.loadJournal();
        });


    }
]);
