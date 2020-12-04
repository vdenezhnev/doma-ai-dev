'use strict';

app.service('Session', ['$localStorage', function($localStorage) {
    var TOKEN_STORAGE_KEY = 'user_token';
    var USER_STORAGE_KEY = 'user_data';
    var ROLE_STORAGE_KEY = 'user_role';

    var SessionProperty = function(storage_name) {
         return {
            get: function() {
                return $localStorage[storage_name];
            },
            set: function(value) {
                if (value == null || value == undefined) {
                    $localStorage.$reset({TOKEN_STORAGE_KEY: null});
                }
                else {
                    $localStorage[storage_name] = value;
                }
            }
         }
    };

    Object.defineProperty(this, 'token', SessionProperty(TOKEN_STORAGE_KEY));
    Object.defineProperty(this, 'user', SessionProperty(USER_STORAGE_KEY));
    Object.defineProperty(this, 'role', SessionProperty(ROLE_STORAGE_KEY));

    this.destroy = function() {
        const selectedLocale = $localStorage.user_locale;

        $localStorage.$reset({TOKEN_SESSION_KEY: null});
        $localStorage.$reset({USER_STORAGE_KEY: null});
        $localStorage.$reset({ROLE_STORAGE_KEY: null});

        if (selectedLocale) {
            $localStorage.user_locale = selectedLocale;
        }
    };
}]);
