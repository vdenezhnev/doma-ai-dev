
app.factory('Camera', ['$resource', 'settings', function($resource, settings) {
  return $resource(settings.API_URL, null, {
    query: {
      url: settings.API_URL + '?action=GetCameras',
      isArray: true,
    },
    save: {
      method:'POST',
      transformRequest: function(data, headers){
        data['action'] = data.isNew ? 'AddCamera' : 'UpdateCamera';
        delete data['isNew'];
        return angular.toJson(data);
      },
      interceptor: {
        response: function (data) {
        }
      }
    },
    delete: {
      method: 'POST',
      transformRequest: function(data, headers) {
        return angular.toJson({
          Action: 'DeleteCamera',
          CameraId: data.CameraId
        });
      }
    },
  });
}]);
