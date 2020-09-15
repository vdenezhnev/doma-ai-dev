'use strict';

app.factory('Address', ['$resource', 'settings', function($resource, settings) {

    var Address = $resource(settings.API_URL, {}, {
        save: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = data.id ? 'EditAddress' : 'AddAddress';
                return angular.toJson(data);
            }
        },
        query: {
            url: settings.API_URL + '?action=GetAddress',
            isArray: true,
            transformResponse: function (data, headers) {
                return JSON.parse(data).items;
            }
        }
    });

    return Address;
}]);
