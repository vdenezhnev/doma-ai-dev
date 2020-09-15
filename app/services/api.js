'use strict';

app.service('Api', ['$http', '$httpParamSerializer', '$q', 'Session',
    function($http, $httpParamSerializer, $q, Session){
    var self = this;

    this.http_headers = function(headers) {
        if (!headers) headers = {};
        if (Session.token) {
            headers['Authorization'] = 'SAS-TOKEN ' + Session.token
        }

        return angular.extend(headers, {
            'Timestamp': new Date().toISOString()
        });
    };

    this.http = function(method, url, data, success, error) {
        return $q(function(resolve, reject) {
            $http({
                method: method,
                data: data,
                url: url,
                headers: self.http_headers()
            }).then(function successCallback(response) {
                if (success != undefined) success(response);
                resolve(response);
            }, function errorCallback(response) {
                if (response.status == 401) {
                    Session.destroy();
                }
                if (error != undefined) error(response);
                reject(response);
            });
        });
    };

    this.post = function(url, data, success, error) {
        return this.http('POST', url, data, success, error);
    };

    this.get = function(url, data, success, error) {
        var query_string = data != null ? '?' + $httpParamSerializer(data) : '';
        return this.http('GET', url + query_string, {}, success, error);
    };

}]);