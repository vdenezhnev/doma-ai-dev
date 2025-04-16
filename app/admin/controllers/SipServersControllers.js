app.controller('SipServersListCtrl', ['$scope', 'Api', 'settings', '$filter', 'notify',
  function ($scope, Api, settings, $filter, notify) {
    $scope.entries = [];
    $scope.skip = 0;
    $scope.take = 20;
    $scope.loadedAll = false;
    $scope.filter = {}

    $scope.loadEntries = function (reset) {
      if (reset) $scope.skip = 0;
      var request = {
        'Action': "GetRegisteredSIPServers",
        'Skip': $scope.skip,
        'Take': $scope.take,
      };

      Api.get(settings.API_URL, request, function (response) {
        $scope.skip += response.data.length;

        if (reset) {
          $scope.entries = response.data;
        } else {
          $scope.entries.push.apply($scope.entries, response.data);
        }

        $scope.loadedAll = response.data.length < $scope.take;
      });
    };

    $scope.loadEntries();
  }
]);
