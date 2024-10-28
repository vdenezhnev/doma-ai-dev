'use strict';

app.controller('OpenyPaymentsListCtrl', ['$scope', 'Api', 'settings',
  function($scope, Api, settings) {
    $scope.filter = {};
    $scope.take = 20;
    $scope.objects = [];
    $scope.skip = 0;
    $scope.isLoadedAll = false;

    $scope.paymentTypeChoices = [
      ['', ''],
      [1, "Per month"],
      [2, "Per year"],
      [3, "Period"],
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
      var queryParams = new URLSearchParams(angular.extend({
        Action: 'GetPayments',
        Skip: $scope.skip,
        Take: $scope.take,
      }, filter));

      Api.get(settings.API_URL + '?' + queryParams).then(function(response){
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
