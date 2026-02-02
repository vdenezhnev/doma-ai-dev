'use strict';

app.factory('VatRate', ['$resource', 'settings', function($resource, settings) {
    return $resource(settings.API_URL, {}, {
        query: {
        url: settings.API_URL + '?action=GetVatCodes',
        method: 'GET',
        isArray: true,
        transformResponse: function (data) {
            var json = angular.fromJson(data);
            return (json && json.vatCodes) ? json.vatCodes : [];
        }
        }
    });
}]);
