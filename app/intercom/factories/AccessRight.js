
app.factory('AccessRight', ['$resource', 'settings', function($resource, settings) {
    return $resource(settings.API_URL, {}, {
        query: {
            url: settings.API_URL + '?action=SearchAccessRights',
            isArray: false
        }
    });
}]);
