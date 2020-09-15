'use strict';

const TARIFF_CACHE_VALUES = 'TariffValues';

app.factory('Tariff', ['$resource', 'appCache', 'settings', function($resource, cache, settings) {

    var Tariff = $resource(settings.API_URL, {}, {
        save: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = data.id ? 'UpdateTariffPolicy' : 'RegisterTariffPolicy';
                return angular.toJson(data);
            },
            interceptor: {
                response: function (data) {
                    cache.remove(TARIFF_CACHE_VALUES);
                }
            }
        },
        query: {
            url: settings.API_URL + '?action=GetTariffPolicies',
            isArray: true
        },
        get: {
            url: settings.API_URL + '?action=GetTariffPolicyRevision'
        },
        apply: {
            method:'POST',
            transformRequest: function(data, headers){
                data['Action'] = 'ApplyTariffPolicy';
                return angular.toJson(data);
            }
        },
        rollback: {
            method:'POST',
            transformRequest: function(data, headers){
                data['Action'] = 'RollbackTariffPolicy';
                return angular.toJson(data);
            }
        },
        delete: {
            interceptor: {
                response: function (data) {
                    cache.remove(TARIFF_CACHE_VALUES);
                }
            }
        }
    });

    Tariff.values = function() {
        if (!cache.get(TARIFF_CACHE_VALUES)) {
            cache.put(TARIFF_CACHE_VALUES, {});
            this.query().$promise.then(function(response){
                var result = {};
                angular.forEach(response, function(item, idx) {
                    result[item.id] = item;
                });
                cache.put(TARIFF_CACHE_VALUES, result);
            });
        }
        return cache.get(TARIFF_CACHE_VALUES);
    };

    Tariff.prototype.getTariff = function(name) {
      for (var i in this.tariffPacket.subscriptions) {
            if (this.tariffPacket.subscriptions[i].type == name) {
                return this.tariffPacket.subscriptions[i];
            }
        }
    };

    Tariff.prototype.getTrialPeriodTypes = function() {
        return ['disabled', 'tillTheEndOfNextMonth'];
    };

    Object.defineProperty(Tariff.prototype, 'monthlyTariff', {
        get: function() {
            return this.getTariff('monthly');
        }
    });

    Object.defineProperty(Tariff.prototype, 'yearlyTariff', {
        get: function() {
            return this.getTariff('yearly');
        }
    });

    return Tariff;
}]);
