'use strict';

/**
 * Доступ к парковочной части API интеркома.
 *
 * Не $resource: методов много, все они action-стиля и половина из них ничего
 * не возвращает, кроме признака успеха. Обёртка над Api читается проще, чем
 * полтора десятка кастомных actions в одном ресурсе.
 */
app.service('Parking', ['Api', 'settings', function (Api, settings) {

  function get(action, params) {
    return Api.get(settings.API_URL, angular.extend({Action: action}, params || {}))
      .then(function (response) {
        return response.data;
      });
  }

  /**
   * Пустой список этот API умеет отдавать строкой «null» — так же, как список
   * локальных серверов в администраторской панели. Строка длиной четыре символа
   * ведёт себя как непустой список и включала бы парковочные элементы там,
   * где парковок нет.
   */
  function asList(data) {
    return angular.isArray(data) ? data : [];
  }

  function post(action, data) {
    return Api.post(settings.API_URL, angular.extend({Action: action}, data || {}))
      .then(function (response) {
        return response.data;
      });
  }

  // ------------------------------------------------ парковочные серверы

  this.getParkings = function () {
    return get('GetParkings').then(asList);
  };

  this.createParking = function (name, addressId) {
    return post('CreateParking', {Name: name, AddressId: addressId});
  };

  this.updateParking = function (parkingServerId, name, addressId) {
    return post('UpdateParking', {
      ParkingServerId: parkingServerId,
      Name: name,
      AddressId: addressId
    });
  };

  this.refreshToken = function (parkingServerId) {
    return post('RefreshParkingToken', {ParkingServerId: parkingServerId});
  };

  this.setAccessRevoked = function (parkingServerId, revoked) {
    return post('SetParkingAccessRevoked', {
      ParkingServerId: parkingServerId,
      Revoked: revoked
    });
  };

  this.deleteParking = function (parkingServerId) {
    return post('DeleteParking', {ParkingServerId: parkingServerId});
  };

  // -------------------------------------------------------------- пулы

  this.getPools = function (parkingServerId) {
    return get('GetParkingPools', {ParkingServerId: parkingServerId}).then(asList);
  };

  this.createPool = function (parkingServerId, name, maxSpaces) {
    return post('CreateParkingPool', {
      ParkingServerId: parkingServerId,
      Name: name,
      MaxSpaces: maxSpaces
    });
  };

  this.updatePool = function (poolId, name, maxSpaces) {
    return post('UpdateParkingPool', {
      PoolId: poolId,
      Name: name,
      MaxSpaces: maxSpaces
    });
  };

  this.deletePool = function (poolId) {
    return post('DeleteParkingPool', {PoolId: poolId});
  };

  this.createSimpleParking = function (parkingServerId, count, startNumber) {
    return post('CreateSimpleParking', {
      ParkingServerId: parkingServerId,
      Count: count,
      StartNumber: startNumber
    });
  };

  // ---------------------------------------------------------- привязки

  this.getPoolBindings = function (poolId) {
    return get('GetParkingPoolBindings', {PoolId: poolId}).then(asList);
  };

  this.getAbonentBindings = function (abonentId) {
    return get('GetAbonentParkingBindings', {AbonentId: abonentId}).then(asList);
  };

  this.bind = function (poolId, abonentId, identifierType, identifierValue) {
    return post('BindParkingIdentifier', {
      PoolId: poolId,
      AbonentId: abonentId,
      IdentifierType: identifierType,
      IdentifierValue: identifierValue
    });
  };

  this.unbind = function (bindingId) {
    return post('UnbindParkingIdentifier', {BindingId: bindingId});
  };

  /**
   * Приведение номера к тому же виду, в котором его хранит сервер парковки:
   * верхний регистр без пробелов. Нужно, чтобы сопоставить привязку с машиной
   * в карточке абонента — там номер введён как попало.
   */
  this.normalize = function (value) {
    if (!value) {
      return '';
    }

    return value.replace(/\s+/g, '').toUpperCase();
  };
}]);
