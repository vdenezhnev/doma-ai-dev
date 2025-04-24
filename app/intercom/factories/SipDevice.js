app.factory('SipDevice', ['$resource', 'settings', function($resource, settings) {
  return $resource(settings.API_URL, null, {
    query: {
      url:     settings.API_URL + '?action=GetSipDevices',
      isArray: true
    },
    save: {
      method: 'POST',
      transformRequest: function(data) {
        data['action'] = data.isNew
          ? 'RegisterSipDevice'
          : 'EditSipDevice';
        return angular.toJson(data);
      }
    },
    delete: {
      method: 'POST',
      transformRequest: function(data) {
        return angular.toJson({
          Action: 'UnregisterSipDevice',
          SipDeviceId: data.SipDeviceId
        });
      }
    }
  });
}]);
