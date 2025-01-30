'use strict';

app.controller('LocalKeysListCtrl', ['$scope', 'Api', 'settings', function ($scope, Api, settings) {
  $scope.keys = [];
  $scope.skip = 0;
  $scope.loadedAllKeys = false;
  $scope.listFilter = {
    keyDate: {
      from: null, to: null
    }
  };

  $scope.loadKeys = function (take, reset, filter) {
    var action = ($scope.q || filter) ? 'SearchEcryptedKeys' : 'GetLatestRegisteredEncryptedKeys';
    var request = {
      'Action': action, 'Skip': $scope.skip, 'Take': take, 'SearchPhrase': $scope.q
    };

    if (filter) {
      request.createDateTo = filter.keyDate.to;
      request.createDateFrom = filter.keyDate.from;
    }

    Api.get(settings.API_URL, request, function (response) {
      $scope.skip += response.data.length;

      if (reset) {
        $scope.keys = response.data;
      } else {
        $scope.keys.push.apply($scope.keys, response.data);
      }

      $scope.loadedAllKeys = response.data.length < take;
    });

  };

  $scope.resetFilter = function () {
    $scope.listFilter.keyDate.to = null;
    $scope.listFilter.keyDate.from = null;
  }

  $scope.$watch('q', function (newVal, oldVal) {
    if (newVal != oldVal) {
      $scope.skip = 0;
      $scope.loadKeys(20, true, $scope.listFilter);
    }
  });

  $scope.$watch('listFilter', function (newVal, oldVal) {
    if (!angular.equals(newVal, oldVal)) {
      $scope.skip = 0;
      $scope.loadKeys(20, true, newVal);
    }
  }, true);

  $scope.loadKeys(20, false);
}]);

app.controller('RegKeysListCtrl', ['$scope', 'Api', 'settings', function ($scope, Api, settings) {
  $scope.keys = [];
  $scope.skip = 0;
  $scope.loadedAllKeys = false;

  $scope.loadKeys = function (take, reset, filter) {
    var request = {
      'Action': 'GetLatestRegisteredCompositeKeys', 'Skip': $scope.skip, 'Take': take,
    };

    Api.get(settings.API_URL, request, function (response) {
      $scope.skip += response.data.items.length;

      if (reset) {
        $scope.keys = response.data.items;
      } else {
        $scope.keys.push.apply($scope.keys, response.data.items);
      }

      $scope.loadedAllKeys = response.data.length < take;
    });
  };

  const a = {
    companyName: "testoleg",
    created: "2024-11-27T08:08:32.3901+00:00",
    id: "d2cd9128-aa90-486c-b51c-b23500862e65",
    isDeleted: false,
    modified: "2025-01-29T07:17:56.2710+00:00",
    period: { from: "2024-11-27T08:08:32.3349+00:00", till: "2024-12-01T23:59:59.0000+00:00" },
    from: "2024-11-27T08:08:32.3349+00:00",
    till: "2024-12-01T23:59:59.0000+00:00",
    status: "approved",
    title: "Территория",
    type: "family",
    userDisplayName: "User 79895384261",
    userEmail: "funikovsasa@gmail.com",
    userId: "caeab565-de8f-48b3-8a18-2021b1e3e073",
    userPhoneNumber: "+79895384261"
  }

  $scope.loadKeys(20, false);
}]);
