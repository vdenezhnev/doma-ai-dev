app.controller('BannedListCtrl', ['$scope', 'Api', 'settings', '$filter', 'notify',
  function ($scope, Api, settings, $filter, notify) {
    $scope.entries = [];
    $scope.skip = 0;
    $scope.take = 20;
    $scope.loadedAllEntries = false;
    $scope.selectedEntries = [];

    $scope.loadEntries = function (reset) {
      if (reset) $scope.skip = 0;
      var request = {
        'Action': "GetBannedHistory",
        'Skip': $scope.skip,
        'Take': $scope.take,
        'SearchPhrase': $scope.q
      };

      Api.get(settings.API_URL, request, function (response) {
        $scope.skip += response.data.length;
        $scope.selectAll = false;
        if (reset) {
          $scope.entries = response.data;
          $scope.selectedEntries = [];
        } else {
          $scope.entries.push.apply($scope.entries, response.data);
        }

        $scope.loadedAllEntries = response.data.length < $scope.take;
      });

    };

    $scope.loadEntries();

    $scope.$watch('q', function (newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.skip = 0;
        $scope.loadEntries($scope.q ? true : false);
      }
    });

    $scope.unban = function (entry) {
      if (window.confirm($filter('translate')('NOTIFY_MESSAGE_UNBAN_CONFIRM'))) {
        let unbanPromises = $scope.selectedEntries.map(e =>
          Api.post(settings.API_URL, {
            'Action': 'Unban',
            'BannedHistoryRecordId': e.id
          }).$promise
        );

        Promise.all(unbanPromises)
          .then(() => {
            notify($filter('translate')('NOTIFY_UNBANNED'));
            $scope.loadEntries(true);
          })
          .catch(() => {
            notify($filter('translate')('NOTIFY_UNBAN_FAILED'));
          });
      }
    };

    $scope.isAllSelected = function () {
      return $scope.entries.length > 0 && $scope.selectedEntries.length === $scope.entries.length;
    };

    $scope.toggleAllEntries = function (selectAll) {
      if (selectAll) {
        $scope.selectedEntries = [...$scope.entries];
      } else {
        $scope.selectedEntries = [];
      }
    };


    $scope.toggleSelection = function (entry) {
      const index = $scope.selectedEntries.findIndex(e => e.id === entry.id);
      if (index > -1) {
        $scope.selectedEntries.splice(index, 1);
      } else {
        $scope.selectedEntries.push(entry);
      }
    };

    $scope.isSelected = function (entry) {
      return $scope.selectedEntries.some(e => e.id === entry.id);
    };
  }
]);
