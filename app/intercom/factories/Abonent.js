'use strict';

app.factory('Abonent', ['$resource', 'Address', 'settings', function($resource, Address, settings) {
    var Abonent = $resource(settings.API_URL, {}, {
        save: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = data.id ? 'UpdateAbonent' : 'RegisterAbonent';
                if (data.id) {
                    data['abonentId'] = data.id;
                }
                return angular.toJson(data);
            }
        },
        query: {
            url: settings.API_URL + '?action=SearchAbonents',
            isArray: false
        },
        delete: {
            method: 'POST',
            transformRequest: function(data, headers) {
                return angular.toJson({
                    action: 'UnregisterAbonent',
                    abonentId: data.id
                });
            }
        }
    });

    Abonent.prototype.getAddress = function() {
        if (this.addressId) {
            return Address.values()[this.addressId];
        }
        return '';
    };

    Abonent.prototype.getKeys = function() {
        var result = [];
        angular.forEach(angular.copy(this.keys), function(item, i) {
            result.push(item.servicedDeviceId);
        });
        return result;
    };

    return Abonent;
}]);
