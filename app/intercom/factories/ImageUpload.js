'use strict';

app.factory('ImageUpload', ['$resource', 'settings',
    function($resource, settings) {
        var ImageUpload = $resource(settings.API_URL, {}, {
            upload: {
                method:'POST',
                transformRequest: function(data, headers){
                    data['action'] = 'UploadImage';
                    return angular.toJson(data);
                }
            }
        });

        return ImageUpload;
    }
]);
