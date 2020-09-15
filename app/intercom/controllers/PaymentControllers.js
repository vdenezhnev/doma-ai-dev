'use strict';

app.controller('PaymentListCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings',
    function($scope, $http, $httpParamSerializer, settings) {

        $scope.filter = {};

        $scope.downloadReport = function() {
            var getParams = angular.extend({action: 'GetPaymentReportByPeriodAndAccessObject'}, $scope.filter);
            $http.get(settings.API_URL + '?' + $httpParamSerializer(getParams), {
                responseType: 'arraybuffer'
            }).success(function(data, status, headers) {
                headers = headers();

                var filename = moment($scope.filter.From).format('YYYY_MM_DD') + '-'
                    + moment($scope.filter.To).format('YYYY_MM_DD');
                var contentType = 'application/vnd.ms-excel';

                var linkElement = document.createElement('a');
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
                } catch (ex) {
                }
            });
        };
    }
]);

app.controller('PaymentsCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'gettextCatalog',
    function($scope, $http, $httpParamSerializer, settings, gettextCatalog) {
        $scope.filter = {};
        $scope.take = 20;
        $scope.objects = [];
        $scope.skip = 0;
        $scope.isLoadedAll = false;

        $scope.paymentTypeChoices = [
          ['', ''],
          [1, gettextCatalog.getString('LockMaintenancePerMonth')],
          [2, gettextCatalog.getString('LockMaintenancePerYear')],
          [3, gettextCatalog.getString('LockMaintenancePeriod')]
        ];

        $scope.loadObjects = function(reset) {
            var filter = angular.copy($scope.filter);
            var timezoneOffset = moment().utcOffset();
            if (!timezoneOffset) {
                timezoneOffset = 240;
            }

            if (filter.PaymentDateFrom) {
                var dateFrom = moment(filter.PaymentDateFrom).hour(0).subtract('minutes', timezoneOffset);
                filter.PaymentDateFrom = dateFrom.format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            }
            if (filter.PaymentDateTill) {
                var dateTill = moment(filter.PaymentDateTill).hour(23).minute(59).seconds(59).subtract('minutes', timezoneOffset);
                filter.PaymentDateTill = dateTill.format('YYYY-MM-DDTHH:mm:ss') + 'Z';
            }
            var queryParams = $httpParamSerializer(angular.extend({
              Action: 'GetPayments',
              skip: $scope.skip,
              take: $scope.take
            }, filter));

            $http.get(settings.API_URL + '?' + queryParams).then(function(response){
                var data = response.data;
                $scope.skip += data.payments.length;

                if (reset) {
                    $scope.objects = data.payments;
                }
                else {
                    $scope.objects.push.apply($scope.objects, data.payments);
                }

                $scope.isLoadedAll = data.payments.length < $scope.take;
            });
        };

        $scope.$watchCollection('filter', function(newVal, oldVal){
            if (newVal !== oldVal) {
                $scope.skip = 0;
                $scope.loadObjects(true);
            }
        });

        $scope.loadObjects();
    }
]);
