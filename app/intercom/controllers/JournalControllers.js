'use strict';

app.controller('JournalListCtrl', ['$scope', 'Journal', 'gettextCatalog', '$httpParamSerializer', '$http', 'settings',
    function($scope, Journal, gettextCatalog, $httpParamSerializer, $http, settings) {
        const emptyWTFilter = {
            period: {
                from: null,
                to: null
            },
            perimeterId: null,
            user: null,
            sumByDays: false
        };

        $scope.filter = {
            Take: 25,
            Skip: 0,
            From: moment().subtract(7, 'days').format('YYYY-MM-DDTHH:mm:ss'),
            Till: moment().format('YYYY-MM-DDTHH:mm:ss')
        };
        $scope.total = 0;
        $scope.canLoadMode = false;
        $scope.journals = [];
        $scope.workingTimeList = [];
        $scope.keyTypes = {
            ble: 'Bluetooth',
            card: gettextCatalog.getString('keyTypes.card'),
            remote: gettextCatalog.getString('keyTypes.remote'),
            gsm: 'GSM',
            button: gettextCatalog.getString('keyTypes.button'),
            mobile: gettextCatalog.getString('keyTypes.mobile')
        };
        $scope.lockAccessTypes = {
            opened: gettextCatalog.getString('lockAccessTypes.opened'),
            accessDenied: gettextCatalog.getString('lockAccessTypes.accessDenied')
        }

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

        $scope.showPerimeterTree = false;
        $scope.workingTimeFilter = angular.copy(emptyWTFilter);

        $scope.showTree = function () {
            $scope.showPerimeterTree = true;
        }

        $scope.compileReport = function () {
            var queryParams = $httpParamSerializer({
                Action: 'GetReportDataLockAccessHistoryJournal',
                UserName: $scope.workingTimeFilter.user,
                From: $scope.workingTimeFilter.period.from,
                Till: $scope.workingTimeFilter.period.to,
                PerimeterId: $scope.workingTimeFilter.perimeterId
            });

            $http.get(settings.API_URL + '?' + queryParams).then(function(response){
                const responseData = response.data;
                if (responseData && responseData.records && responseData.records.length) {
                    $scope.workingTimeList = getFilteredRecords(responseData.records, $scope.workingTimeFilter.sumByDays);
                }
            });
        }

        $scope.resetWTFilter = function () {
            $scope.showPerimeterTree = false;
            angular.extend($scope.workingTimeFilter, emptyWTFilter);
            $scope.resetWTFilterDates();
        }

        $scope.resetWTFilterDates = function () {
            $scope.workingTimeFilter.period.from = null;
            $scope.workingTimeFilter.period.to = null;
        }

        $scope.downloadCSV = function () {
            var getParams = {
                action: 'ExportReportDataLockAccessHistoryJournal',
                IsSumWorkDay: $scope.workingTimeFilter.sumByDays,
                UserName: $scope.workingTimeFilter.user,
                From: $scope.workingTimeFilter.period.from,
                Till: $scope.workingTimeFilter.period.to,
                PerimeterId: $scope.workingTimeFilter.perimeterId
            };
            $http.get(settings.API_URL + '?' + $httpParamSerializer(getParams), {
                responseType: 'arraybuffer'
            }).success(function(data, status, headers) {
                const filename = 'working_time_' + moment($scope.filter.From).format('YYYY_MM_DD') + '-'
                    + moment($scope.filter.To).format('YYYY_MM_DD');
                const contentType = 'text/csv';
                const linkElement = document.createElement('a');

                try {
                    var blob = new Blob([data], { type: contentType });
                    var url = window.URL.createObjectURL(blob);

                    linkElement.setAttribute('href', url);
                    linkElement.setAttribute("download", filename);

                    var clickEvent = new MouseEvent("click", {
                        "view": window,
                        "bubbles": true,
                        "cancelable": false
                    });
                    linkElement.dispatchEvent(clickEvent);
                } catch (ex) {}
            });
        }

        function getFilteredRecords(records, groupByUser) {
            if (!records || !records.length) {
                return [];
            }

            const result = [];

            records.forEach(element => {
                if (groupByUser) {
                    result.push({
                        workTime: element.totalWorkTime,
                        userName: element.userName,
                        entryExitDate: null,
                        entryTime: null,
                        exitTime: null,
                        isGroupRow: true,
                     });
                }

                if (element.reportDataLockHistoryRecordDtos && element.reportDataLockHistoryRecordDtos.length) {
                    result.push(...element.reportDataLockHistoryRecordDtos);
                }
            });

            return result;
        }


    }
]);
