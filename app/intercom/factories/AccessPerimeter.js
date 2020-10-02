
app.factory('AccessPerimeter', ['$resource', '$q', 'settings', function($resource, $q, settings) {
    var AccessPerimeter = $resource(settings.API_URL, {}, {
        save: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = data.id ? 'EditAccessPerimeter' : 'CreateAccessPerimeter';
                if (data.id) {
                    data['id'] = data.id;
                }
                return angular.toJson(data);
            }
        },
        delete: {
            method: 'POST',
            transformRequest: function(data, headers){
                data['Action'] = 'DeleteAccessPerimeter';
                return angular.toJson(data);
            }
        },
        query: {
            url: settings.API_URL + '?action=GetAccessPerimeters',
            isArray: false
        },
        generateQR: {
            url: settings.API_URL + '?action=GeneratePerimeterKeyRequestPdf',
            responseType: 'arraybuffer',
            transformResponse: function(data, headersGetter) {
                return {
                  data: data,
                  headers: headersGetter
                }
            },
            interceptor: {
                responseError: function(error) {
                    if (error) {
                        var headers = error.headers();

                        if (headers && headers['content-type'] && headers['content-type'].startsWith('application/json')) {
                            var decoder = new TextDecoder("utf-8");
                            var json = JSON.parse(decoder.decode(error.data.data));

                            return $q.reject(json);
                        }
                    }
                }
            }
        }
    });

    return AccessPerimeter;
}]);
