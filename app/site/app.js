'use strict';

var app = angular.module('app', [
    'ngStorage',
    'gettext',
    'cgBusy',
    'validation',
    'validation.rule',
    'smartkey.validation-rule'
]);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.headers.post = {'Content-Type': 'application/json'};
}]);

app.constant('settings', {
    API_URL: window.__api_host + window.__api_url
});

app.run(['$rootScope', '$injector', 'gettextCatalog', 'Session', 'UserClient', 'cgBusyDefaults',
    function($rootScope, $injector, gettextCatalog, Session, UserClient, cgBusyDefaults){
    $rootScope.language = window.__language;
    gettextCatalog.setCurrentLanguage($rootScope.language);

    cgBusyDefaults.message = gettextCatalog.getString('busy.title');

    $rootScope.user = UserClient;
    UserClient.listen($rootScope);
}]);
