'use strict';

app.controller('AppCtrl', ['$scope', 'User', 'notify', 'availableLocales', '$localStorage', 'defaultLocale',
    function($scope, User, notify, availableLocales, $localStorage, defaultLocale) {
        $scope.availableLocales = availableLocales;
        $scope.selectedLocale = $localStorage.user_locale;

        if (!$scope.selectedLocale) {
            $scope.selectedLocale = defaultLocale.key;
            $localStorage.user_locale = defaultLocale.key;
        }

        $scope.isRTL = $scope.selectedLocale === 'AR';

        $scope.onChangeLocale = function (locale) {
            $localStorage.user_locale = locale;
            $scope.selectedLocale = locale;
            $scope.$emit('user:changeLocale', { locale: locale });
        };

        $scope.logout = function () {
            User.unload();
        };

        notify.config({
            duration: 5000
        });
    }
]);


app.controller('LoginCtrl', ['$scope', '$http', '$state', 'notify', 'settings', 'User',
    function($scope, $http, $state, notify, settings, User) {
        $scope.submit = function() {
            $http.post(settings.API_URL, {
                Action: 'Login',
                Login: $scope.login,
                Password: Base64.encode($scope.password)
            }).then(function successCallback(response) {
                User.load(response.data.profile, response.data.credentials, response.data.role);
            });
        }
    }
]);