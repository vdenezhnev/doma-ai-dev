'use strict';

app.controller('LoginCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'User', function($scope, $http, $httpParamSerializer, settings, User) {
    $scope.login = '';
    $scope.password = '';
    $scope.defaultCompanyProfiles = [];
    $scope.companyProfiles = undefined;
    $scope.hasMoreProfiles = false;
    $scope.q = '';

    $scope.submit = function() {
        $http.post(settings.API_URL, {
            Action: 'LoginV2',
            Login: $scope.login,
            Password: Base64.encode($scope.password)
        }).then(function successCallback(response) {
            $scope.hasMoreProfiles = response.data.hasMoreProfiles;
            if ($scope.hasMoreProfiles) {
                $scope.defaultCompanyProfiles = [];
                $scope.companyProfiles = [];
            }
            else {
                if (response.data.profiles.length === 1) {
                    $scope.selectProfile(response.data.profiles[0].id);
                }
                else {
                    $scope.defaultCompanyProfiles = response.data.profiles;
                    $scope.companyProfiles = response.data.profiles;
                }
            }
        });
    };

    $scope.selectProfile = function (id) {
        $http.post(settings.API_URL, {
            Action: 'LoginV2',
            Login: $scope.login,
            Password: Base64.encode($scope.password),
            ServiceCompanyId: id
        }).then(function successCallback(response) {
           User.load(response.data.profiles[0], response.data.credentials);
        });
    };

    $scope.$watch('q', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            if (newVal.length > 2) {
                var params = {
                    Action: 'GetLoginUserServiceCompanyProfiles',
                    Login: $scope.login,
                    Filter: newVal
                };
                $http.get(settings.API_URL + '?' + $httpParamSerializer(params)).then(function (response) {
                    $scope.companyProfiles = response.data.profiles;
                });
            }
            else {
                $scope.companyProfiles = $scope.defaultCompanyProfiles;
            }
        }
    })
}]);

app.controller('ActivateAccountCtrl', ['$scope', '$state', '$stateParams', 'notify', '$http', 'settings', 'gettextCatalog',
    function($scope, $state, $stateParams, notify, $http, settings, gettextCatalog) {
        if (!$stateParams.code) {
            $state.go('auth.login');
        }

        $scope.submit = function() {
            $http.post(settings.API_URL, {
                Action: 'ActivateAccount',
                ActivationCode: $stateParams.code,
                NewPassword: Base64.encode($scope.password)
            }).then(function successCallback(response) {
                notify(gettextCatalog.getString('auth.account_activated'));
                $state.go('auth.login');
            });
        }
    }
]);

app.controller('RestorePasswordCtrl', ['$scope', '$http', 'settings', function($scope, $http, settings) {

    $scope.submit = function() {
        $http.post(settings.API_URL, {
            Action: 'RestorePassword',
            Login: $scope.login
        }).then(function successCallback(response) {
            if (response.status == 200) {
                $scope.success = true;
            }
        });
    };
}]);

app.controller('ConfirmPasswordResetCtrl', ['$scope', '$stateParams', '$state', '$http', 'settings', 'notify', 'gettextCatalog',
    function($scope, $stateParams, $state, $http, settings, notify, gettextCatalog) {
        if (!$stateParams.code) {
            $state.go('auth.restore_password');
        }

        $scope.submit = function() {
            $http.post(settings.API_URL, {
                Action: 'ConfirmPasswordReset',
                ConfirmationCode: $stateParams.code,
                NewPassword: Base64.encode($scope.password)
            }).then(function successCallback(response) {
                notify(gettextCatalog.getString('auth.password_changed'));
                $state.go('auth.login');
            });
        };
    }
]);

app.controller('ConfirmPasswordResetWebCtrl', ['$scope', '$stateParams', '$state', '$http', 'settings', 'notify', 'gettextCatalog',
    function($scope, $stateParams, $state, $http, settings, notify, gettextCatalog) {
        $scope.code = $stateParams.code;
        $scope.passwordChanged = false;

        if ($scope.code) {
            $scope.submit = function () {
                $http.post(settings.API_HOST + 'api/web', {
                    Action: 'ConfirmPasswordReset',
                    ConfirmationCode: $stateParams.code,
                    NewPassword: Base64.encode($scope.password)
                }).then(function successCallback(response) {
                    notify(gettextCatalog.getString('auth.password_changed'));
                    $scope.passwordChanged = true;
                });
            };
        }
    }
]);

app.controller('MobilePasswordResetWebCtrl', ['$scope', '$stateParams', '$http', 'settings', 'notify', 'gettextCatalog',
    function($scope, $stateParams, $http, settings, notify, gettextCatalog) {
        $scope.code = $stateParams.code;
        $scope.passwordChanged = false;

        if ($scope.code) {
            $scope.submit = function () {
                $http.post(settings.API_HOST + 'api/web', {
                    Action: 'ConfirmPasswordReset',
                    ConfirmationCode: $stateParams.code,
                    NewPassword: Base64.encode($scope.password)
                }).then(function successCallback(response) {
                    notify(gettextCatalog.getString('auth.password_changed'));
                    $scope.passwordChanged = true;
                });
            };

            $scope.isDisabledButton = function () {
                return $scope.PasswordResetForm.new_password.$pristine || $scope.PasswordResetForm.new_password_confirm.$pristine || $scope.PasswordResetForm.$invalid;
            }
        }
    }
]);
