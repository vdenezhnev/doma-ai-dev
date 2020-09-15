'use strict';

app.factory('ControlPanelUser', ['$resource', 'settings', function($resource, settings) {
    return $resource(settings.API_URL, {}, {
        save: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = data.id ? 'ChangeAccessControlPanelUser' : 'AddAccessControlPanelUser';
                return angular.toJson(data);
            }
        },
        query: {
            url: settings.API_URL + '?action=GetAccessControlPanelUsers',
            isArray: true
        },
        delete: {
            method: 'POST',
            transformRequest: function(data, headers){
                if (!data) {
                    data = {};
                }
                data['Action'] = 'DeleteAccessControlPanelUser';
                return angular.toJson(data);
            }
        }
    });
}]);
