'use strict';

app.controller('ParkingListCtrl', ['$scope', '$state', 'Parking', 'gettextCatalog', 'notify',
  function ($scope, $state, Parking, gettextCatalog, notify) {
    $scope.parkings = [];
    $scope.isLoaded = false;
    $scope.newParking = {};

    $scope.load = function () {
      Parking.getParkings().then(function (parkings) {
        $scope.parkings = parkings || [];
        $scope.isLoaded = true;
      });
    };

    /**
     * Единственный признак, по которому из облака видно, что сервер парковки
     * на объекте жив: конфигурацию он забирает сам, снаружи к нему не достучаться.
     * Молчание дольше суток почти всегда означает, что на объекте что-то сломалось,
     * и об этом никто не знает.
     */
    $scope.isSyncStale = function (parking) {
      if (!parking.lastSyncAt) {
        return true;
      }

      var day = 24 * 60 * 60 * 1000;
      return new Date() - new Date(parking.lastSyncAt) > day;
    };

    $scope.create = function () {
      if (!$scope.newParking.name) {
        return;
      }

      Parking.createParking($scope.newParking.name, $scope.newParking.addressId).then(function (parking) {
        notify(gettextCatalog.getString('parking.parking_created'));
        $scope.newParking = {};
        $state.go('admin.parking.detail', {id: parking.id});
      });
    };

    $scope.load();
  }
]);

app.controller('ParkingDetailCtrl', ['$scope', '$state', '$stateParams', 'Parking', 'gettextCatalog', 'notify',
  function ($scope, $state, $stateParams, Parking, gettextCatalog, notify) {
    $scope.parkingId = $stateParams.id;
    $scope.parking = null;
    $scope.draft = {};
    $scope.pools = [];
    $scope.newPool = {maxSpaces: 1};
    $scope.simple = {count: null, startNumber: 1};
    $scope.maxSimpleCount = 1000;
    $scope.poolQuery = '';

    /** Порог, за которым список пулов перестаёт просматриваться целиком. */
    $scope.manyPoolsThreshold = 12;

    $scope.visiblePools = function () {
      var query = ($scope.poolQuery || '').trim().toLowerCase();
      if (!query) {
        return $scope.pools;
      }

      return $scope.pools.filter(function (pool) {
        return (pool.name || '').toLowerCase().indexOf(query) > -1;
      });
    };

    $scope.load = function () {
      Parking.getParkings().then(function (parkings) {
        $scope.parking = (parkings || []).filter(function (item) {
          return item.id === $scope.parkingId;
        })[0];

        if (!$scope.parking) {
          return $state.go('admin.parking.list');
        }

        $scope.draft = {name: $scope.parking.name, addressId: $scope.parking.addressId};
      });

      Parking.getPools($scope.parkingId).then(function (pools) {
        $scope.pools = pools || [];
      });
    };

    $scope.totalSpaces = function () {
      return $scope.pools.reduce(function (sum, pool) {
        return sum + pool.maxSpaces;
      }, 0);
    };

    // ---------------------------------------------------- сервер парковки

    $scope.saveParking = function () {
      if (!$scope.draft.name) {
        return;
      }

      Parking.updateParking($scope.parkingId, $scope.draft.name, $scope.draft.addressId).then(function () {
        notify(gettextCatalog.getString('parking.parking_updated'));
        $scope.load();
      });
    };

    /**
     * До внесения нового токена в настройки сервера на объекте синхронизация
     * прекратится. Парковка продолжит работать по последней конфигурации,
     * но изменения до неё доходить не будут.
     */
    $scope.refreshToken = function () {
      if (!window.confirm(gettextCatalog.getString('parking.confirm_refresh_token'))) {
        return;
      }

      Parking.refreshToken($scope.parkingId).then(function (parking) {
        $scope.parking = parking;
        notify(gettextCatalog.getString('parking.token_refreshed'));
      });
    };

    $scope.toggleAccess = function () {
      var revoked = !$scope.parking.accessRevoked;

      if (revoked && !window.confirm(gettextCatalog.getString('parking.confirm_revoke'))) {
        return;
      }

      Parking.setAccessRevoked($scope.parkingId, revoked).then(function () {
        $scope.parking.accessRevoked = revoked;
        notify(gettextCatalog.getString(revoked ? 'parking.access_revoked' : 'parking.access_restored'));
      });
    };

    /**
     * Вместе с сервером теряются все пулы и привязки, поэтому подтверждение —
     * вводом названия, а не кнопкой «да».
     */
    $scope.deleteParking = function () {
      var answer = window.prompt(gettextCatalog.getString('parking.confirm_delete_parking'));
      if (answer === null) {
        return;
      }

      if (answer.trim() !== $scope.parking.name) {
        window.alert(gettextCatalog.getString('parking.delete_name_mismatch'));
        return;
      }

      Parking.deleteParking($scope.parkingId).then(function () {
        notify(gettextCatalog.getString('parking.parking_deleted'));
        $state.go('admin.parking.list');
      });
    };

    $scope.copy = function (value, message) {
      if (!value) {
        return;
      }

      var input = document.createElement('input');
      input.value = value;
      document.body.appendChild(input);
      input.select();

      try {
        document.execCommand('copy');
        notify(gettextCatalog.getString(message));
      } finally {
        document.body.removeChild(input);
      }
    };

    // ---------------------------------------------------------------- пулы

    $scope.createPool = function () {
      if (!$scope.newPool.name) {
        return;
      }

      Parking.createPool($scope.parkingId, $scope.newPool.name, $scope.newPool.maxSpaces)
        .then(function () {
          notify(gettextCatalog.getString('parking.pool_created'));
          $scope.newPool = {maxSpaces: 1};
          $scope.load();
        });
    };

    $scope.editPool = function (pool) {
      pool.editing = true;
      pool.draftName = pool.name;
      pool.draftMaxSpaces = pool.maxSpaces;
    };

    $scope.cancelEdit = function (pool) {
      pool.editing = false;
    };

    $scope.savePool = function (pool) {
      // Уменьшение квоты не выгоняет тех, кто уже внутри: сервер парковки
      // не трогает машины, находящиеся на территории. Но новые въезды по пулу
      // будут блокироваться, пока занятость не опустится ниже нового лимита.
      if (pool.draftMaxSpaces < pool.maxSpaces
        && !window.confirm(gettextCatalog.getString('parking.confirm_reduce_spaces'))) {
        return;
      }

      Parking.updatePool(pool.id, pool.draftName, pool.draftMaxSpaces).then(function () {
        notify(gettextCatalog.getString('parking.pool_updated'));
        pool.editing = false;
        $scope.load();
      });
    };

    $scope.deletePool = function (pool) {
      if (pool.boundIdentifierCount > 0) {
        window.alert(gettextCatalog.getString('parking.pool_has_bindings'));
        return;
      }

      if (!window.confirm(gettextCatalog.getString('parking.confirm_delete_pool'))) {
        return;
      }

      Parking.deletePool(pool.id).then(function () {
        notify(gettextCatalog.getString('parking.pool_deleted'));
        $scope.load();
      });
    };

    /**
     * «Простой паркинг» — парковка без общих квот, где у каждого жильца
     * закреплённое место. Отдельный пул на место выражает именно это.
     */
    $scope.simplePreview = function () {
      var count = parseInt($scope.simple.count, 10);
      if (!count || count < 1) {
        return null;
      }

      var start = parseInt($scope.simple.startNumber, 10) || 1;

      return {
        count: count,
        first: gettextCatalog.getString('parking.place_name') + ' ' + start,
        last: gettextCatalog.getString('parking.place_name') + ' ' + (start + count - 1)
      };
    };

    $scope.createSimpleParking = function () {
      var preview = $scope.simplePreview();
      if (!preview) {
        return;
      }

      if (preview.count > $scope.maxSimpleCount) {
        window.alert(gettextCatalog.getString('parking.simple_count_too_big'));
        return;
      }

      // Тысячу пулов легко создать по ошибке, а удалять их придётся поштучно.
      if (!window.confirm(gettextCatalog.getString('parking.confirm_simple_parking') + ' ' + preview.count)) {
        return;
      }

      var start = parseInt($scope.simple.startNumber, 10) || 1;

      Parking.createSimpleParking($scope.parkingId, preview.count, start).then(function () {
        notify(gettextCatalog.getString('parking.simple_parking_created'));
        $scope.simple = {count: null, startNumber: 1};
        $scope.load();
      });
    };

    $scope.load();
  }
]);
