'use strict';

app.factory('AuthorizationInterceptor', ['$q', '$injector', 'settings', function($q, $injector, settings) {
    return {
        request: function(config) {
            var user = $injector.get('User');
            if (user.isAuthenticated() && URI(config.url).host() == URI(settings.API_URL).host()) {
                config.headers['Authorization'] = 'SAS-TOKEN ' + user.token;
                config.headers['Timestamp'] = new Date().toISOString();
            }
            return config;
        },
        responseError: function(response) {
            if (response.status == 401) {
                var user = $injector.get('User');
                if (user.isAuthenticated())
                    user.unload();
            }
            return $q.reject(response);
        }
    };
}]);

app.factory('LanguageInterceptor', ['$q', '$injector', 'settings', function($q, $injector, settings) {
    return {
        request: function(config) {
            var language = $injector.get('Language');
            config.headers['Accept-Language'] = language.getCode();
            return config;
        }
    };
}]);

app.factory('BrandIdInterceptor', ['$q', '$injector', 'settings', function($q, $injector, settings) {
    return {
        request: function(config) {
            config.headers['X-BrandId'] = window.__brand_id;
            return config;
        }
    };
}]);

app.factory('NotificationInterceptor', ['$q', '$injector', function($q, $injector) {
    return {
        responseError: function(response) {
            var notify = $injector.get('notify');
            if (response.data.error || response.data.developerDetails) {
                notify({
                    message: [response.data.error, response.data.developerDetails].join(' - '),
                    classes: 'alert-danger'
                });
            }
            return $q.reject(response);
        }
    };
}]);
