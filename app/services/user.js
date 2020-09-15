'use strict';

app.service('User', ['$http', '$q', 'Session', function($http, $q, Session){

    var self = this;

    Object.defineProperty(this, 'data', {
        get: function() {
            return Session.user || {};
        },
        set: function(value) {
            Session.user = value;
        }
    });

    Object.defineProperty(this, 'token', {
        get: function() {
            return Session.token || {};
        }
    });

    this.isAuthenticated = function() {
        return this.data.id !== undefined;
    };

    this.load = function(profile, credentials) {
        if (profile != null)
            this.data = profile;

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
