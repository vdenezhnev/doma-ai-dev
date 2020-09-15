
app.service('AuthService', ['$http', '$q', 'API_URL', 'UserClient', function($http, $q, API_URL) {

    this.login = function(username, password) {
        return $q(function(resolve, reject) {
            $http({
                method: 'POST',
                url: API_URL.client,
                data: {
                    Action: 'Login',
                    Login: username,
                    Password: Base64.encode(password)
                }
            }).then(function successCallback(response) {
                resolve(response);
            }, function errorCallback(response) {
                reject(response);
            });
        });
    };

    this.registration = function(data) {
        return $q(function(resolve, reject) {
            $http({
                method: 'POST',
                url: API_URL.client,
                data: angular.extend({Action: 'RegisterUser'}, data)
            }).then(function successCallback(response) {
                resolve(response);
            }, function errorCallback(response) {
                reject(response);
            });
        });
    };

    this.confirmPhone = function(phone) {
        return $q(function (resolve, reject) {
            $http({
                method: 'POST',
                url: API_URL.client,
                data: {
                    Action: 'ConfirmPhoneNumber',
                    PhoneNumber: phone
                }
            }).then(function successCallback(response) {
                resolve(response);
            }, function errorCallback(response) {
                reject(response);
            });
        });
    };


}]);
