'use strict';

app.factory('Device', ['$resource', 'settings',
    function($resource, settings) {
        var Device = $resource(settings.API_URL, {}, {
            save: {
                method:'POST',
                transformRequest: function(data, headers){
                    data['action'] = data.isNew ? 'CreateAccessiblePoint' : 'EditAccessiblePoint';
                    delete data['isNew'];
                    return angular.toJson(data);
                },
                interceptor: {
                    response: function (data) {
                    }
                }
            },
            query: {
                url: settings.API_URL + '?action=GetAllAccessiblePoints',
                isArray: true,
                transformResponse: function (data, headers) {
                    return JSON.parse(data).items;
                }
            },
            delete: {
                method: 'POST',
                transformRequest: function(data, headers){
                    var newData = {
                        action: 'RemoveAccessiblePoint',
                        LockId: data['lockId']
                    };
                    return angular.toJson(newData);
                },
                interceptor: {
                    response: function (data) {
                    }
                }
            }
        });

        return Device;
    }
]);
