
app.service('UserClient', ['User', 'Session', 'Api', 'settings', function(User, Session, Api, settings) {
    var UserClient = angular.extend(User, {});

    UserClient.loadProfile = function() {
        var self = this;
        return Api.get(settings.API_URL, {Action: 'GetUserProfile'}, function(response) {
            self.data = response.data;
        }, function(response) {
            self.unload();
        });
    };

    UserClient.changePassword = function(oldPassword, newPassword) {
        var data = {
            'Action': 'ChangePassword',
            'OldPassword': Base64.encode(oldPassword),
            'NewPassword': Base64.encode(newPassword)
        };
        return Api.post(settings.API_URL, data, function(response) {
            Session.token = response.data.apiKeyId + ':' + response.data.token;
        });
    };

    UserClient.updateProfile = function(data) {
        var self = this;
        if (!data) data = {};
        return Api.post(settings.API_URL, angular.extend(data, {'Action': 'UpdateUserProfile'}),
            function(response) {
                angular.extend(self.data, data);
            });
    };

    UserClient.blockKeys = function() {
        return Api.post(settings.API_URL, {'Action': 'BlockMobilePhoneKeys'});
    };

    UserClient.unblockKeys = function() {
        return Api.post(settings.API_URL, {'Action': 'UnblockMobilePhoneKeys'});
    };

    UserClient.loadPayments = function(skip, take) {
        var self = this;
        return Api.get(settings.API_URL, {Action: 'GetUserPayments', Skip: skip, Take: take}, function (response) {
            angular.extend(self.data, response.data);
        });
    };

    UserClient.paymentLink = function(amount) {
        return Api.post(settings.API_URL, {
            'Action': 'ConfirmRecharge',
            'Payment' : {'Value': amount, 'Currency': 'RUB'}
        });
    };

    UserClient.paymentRecommendations = function() {
        return Api.get(settings.API_URL, {
            'Action': 'GetPaymentRecommendations'
        });
    };

    UserClient.deleteKey = function(key, id) {
        var self = this;
        return Api.post(settings.API_URL, {
            Action: 'DeleteKey',
            KeyId: id ? id : key.id
        }, function (response) {
            if (key.duplicateKey) {
                self.data.duplicateOrders.splice(key, 1);
            }
            else {
                self.data.keys.splice(key, 1);
            }
        });
    };

    UserClient.initialize = function() {
        if (Session.token) {
            this.loadProfile();
        }
    };

    UserClient.initialize();

    return UserClient;
}]);
