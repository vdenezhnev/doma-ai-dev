
app.factory('AccessPerimeter', ['$resource', 'settings', function($resource, settings) {
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
            }
        }
    });

    return AccessPerimeter;
}]);
