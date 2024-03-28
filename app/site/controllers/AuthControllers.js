'use strict';

app.controller('RegistrationCtrl', ['$rootScope', '$scope', 'UserClient', 'User', 'Api', 'settings',
    function($rootScope, $scope, UserClient, User, Api, settings) {

    $scope.smsSended = false;

    $scope.process = function() {
        $scope.response = undefined;

        if (!$scope.smsSended && $scope.data.phoneNumber) {
            $scope.loader = Api.post(settings.API_URL, {
                Action: 'ConfirmPhoneNumber',
                PhoneNumber: $scope.data.phoneNumber
            }).then(function successCallback(response) {
                $scope.smsSended = true;
            }, function errorCallback(response) {
                $scope.response = response.data;
            });
        }
        else if ($scope.smsSended) {
            $scope.loader = Api.post(settings.API_URL, {
                Action: 'RegisterUser',
                PhoneNumber: $scope.data.phoneNumber,
                PhoneNumberConfirmationCode: $scope.data.phoneNumberConfirmationCode,
                Email: $scope.data.email,
                DisplayName: $scope.data.displayName,
                Password: Base64.encode($scope.data.password)
            }).then(function successCallback(response) {
                User.load(response.data.profile, response.data.credentials, response.data.role);
                window.location.href = '/' + $rootScope.language + '/cabinet/profile'
            }, function errorCallback(response) {
                $scope.response = response.data;
            });
        }
    };

    $scope.sendAnotherSms = function() {
        $scope.loader = Api.post(settings.API_URL, {
            Action: 'ConfirmPhoneNumber',
            PhoneNumber: $scope.data.phoneNumber
        }).then(function successCallback(response) {}, function errorCallback(response) {
            $scope.response = response.data;
        });
    };
}]);


app.controller('LoginCtrl', ['$scope', 'UserClient', 'Api', 'settings', function($scope, UserClient, Api, settings) {
    $scope.login = function () {
        $scope.loader = Api.post(settings.API_URL, {
            Action: 'Login',
            Login: $scope.data.login,
            Password: Base64.encode($scope.data.password)
        }).then(function successCallback(response) {
            UserClient.load(response.data.profile, response.data.credentials);
            $scope.response = '';
        }, function errorCallback(response) {
            $scope.response = response.data;
        });
    };
}]);

app.controller('RestorePasswordCtrl', ['$scope', 'UserClient', 'Api', 'settings', function($scope, UserClient, Api, settings) {
    $scope.restore = function () {
        $scope.loader = Api.post(settings.API_URL, {
            Action: 'RestorePassword',
            PhoneNumber: $scope.data.phoneNumber
        }).then(function successCallback(response) {
            $scope.response = '';
            $scope.success = true;
        }, function errorCallback(response) {
            $scope.response = response.data;
        });
    };
}]);

app.controller('ResetPasswordCtrl', ['$scope', 'UserClient', 'Api', 'settings', function($scope, UserClient, Api, settings) {
    var uri = new URI(window.location);
    var code = uri.search(true)['code'];
    $scope.newPassword = '';

    if (!code) {
        window.location = '/';
    }

    $scope.reset = function () {
        $scope.loader = Api.post(settings.API_URL, {
            Action: 'ConfirmPasswordReset',
            NewPassword: Base64.encode($scope.newPassword),
            ConfirmationCode: code
        }).then(function successCallback(response) {
            $scope.response = '';
            $scope.success = true;
        }, function errorCallback(response) {
            $scope.response = response.data;
        });
    };
}]);

//app.controller('ConfirmEmailCtrl', ['$scope', 'Api', 'settings', function ($scope, Api, settings) {
//    var uri = new URI(window.location);
//    var code = uri.search(true)['code'];
//    if (code) {
//        $scope.loader = Api.post(settings.API_HOST + 'api/web', {
//            Action: 'ConfirmEmail',
//            ConfirmationCode: code
//        }).then(function successCallback(response) {
//            $scope.email_confirmed = true;
//        }, function errorCallback(response) {
//            $scope.email_error = response.data.error;
//        });
//    }
//    else {
//        window.location = '/';
//    }
//}]);