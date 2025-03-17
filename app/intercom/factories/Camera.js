
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
        return angular.toJson(data);
      },
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
