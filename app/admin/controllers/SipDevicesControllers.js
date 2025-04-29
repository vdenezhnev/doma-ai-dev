app.controller('SipDevicesListCtrl', [
  '$scope', 'Api', 'settings', '$filter', 'notify',
  function ($scope, Api, settings, $filter, notify) {

    $scope.entries = [];
    $scope.skip = 0;
    $scope.take = 20;
    $scope.loadedAll = false;
    $scope.filter = {};

    $scope.loadEntries = function (reset) {
      if (reset) $scope.skip = 0;

      var request = {
        Action: "GetSipDevices",
        Skip: $scope.skip,
        Take: $scope.take
      };

      Api.get(settings.API_URL, request, function (resp) {
        $scope.skip += resp.data.length;

        if (reset) {
          $scope.entries = resp.data;
        } else {
          $scope.entries.push.apply($scope.entries, resp.data);
        }

        $scope.loadedAll = resp.data.length < $scope.take;
      });
    };

    $scope.loadEntries();
  }
]);
