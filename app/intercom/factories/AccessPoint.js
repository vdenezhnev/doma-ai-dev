
app.factory('AccessPoint', ['$resource', 'settings', function($resource, settings) {
    var AccessPoint = $resource(settings.API_URL, {}, {
        save: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = data.id ? 'EditAccessPoint' : 'CreateAccessPoint';
                if (data.id) {
                    data['id'] = data.id;
                }
                return angular.toJson(data);
            }
        },
        replace: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = 'ReplaceLockForAccessPoint';
                return angular.toJson(data);
            }
        },
        update: {
            method: 'POST'
        },
        query: {
            url: settings.API_URL + '?action=GetAllAccessPoints',
            isArray: false
        },
        get: {
            url: settings.API_URL + '?action=GetAccessPoint'
        },
        grouped: {
            url: settings.API_URL + '?action=GetAllAccessPoints',
            isArray: false,
            transformResponse: function (data, headers) {
                var wrapped = JSON.parse(data);
                var result = {};
                _.forEach(wrapped.items, function(value) {
                    if (!_.has(result, value.perimeterId)) {
                        result[value.perimeterId] = []
                    }
                    result[value.perimeterId].push(value);
                });

                return result;
            }
        },
        delete: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = 'DeleteAccessPoint';
                data['id'] = data.id;
                return angular.toJson(data);
            }
        }
    });

    return AccessPoint;
}]);
