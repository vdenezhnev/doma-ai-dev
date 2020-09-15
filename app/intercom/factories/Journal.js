'use strict';

app.factory('Journal', ['$resource', 'settings', function($resource, settings) {
    return $resource(settings.API_URL, {}, {
        query: {
            url: settings.API_URL + '?action=GetLockAccessHistoryJournal',
            isArray: false
        }
    });
}]);
