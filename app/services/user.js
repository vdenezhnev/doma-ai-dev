'use strict';

app.service('User', ['$http', 'Session', 'settings', function($http, Session, settings){

    var self = this;

    Object.defineProperty(this, 'data', {
        get: function() {
            return Session.user || {};
        },
        set: function(value) {
            Session.user = value;
        }
    });

    Object.defineProperty(this, 'role', {
        get: function() {
            return Session.role || {};
        },
        set: function(value) {
            Session.role = value;
        }
    });

    Object.defineProperty(this, 'token', {
        get: function() {
            return Session.token || {};
        }
    });

    this.updateKeyCountInfo = function () {
        return $http.get(`${settings.API_URL}?action=GetKeyCountServiceCompany`)
            .then(function successCallback(response) {
                angular.extend(self.data.keyCount, response.data);
            });
    };

    this.isAuthenticated = function() {
        return this.data.id !== undefined;
    };

    this.load = function(profile, credentials, role) {
        if (profile != null) {
            this.data = profile;
        }

        if (role) {
            this.role = role;
        }

        if (credentials != undefined && credentials != null)
            Session.token = credentials.apiKeyId + ':' + credentials.token;
    };

    this.unload = function() {
        Session.destroy();
    };

    this.listen = function($scope) {
        $scope.$watch(function(){
            return self.isAuthenticated();
        }, function(newValue, oldValue) {
            if (newValue !== oldValue) {
                if (!self.isAuthenticated()) {
                    $scope.$broadcast('user:logout');
                }
                else {
                    $scope.$broadcast('user:login');
                }
            }
        });
    };
}]);
