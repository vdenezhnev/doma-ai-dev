'use strict';

app.controller('TokenQrCodeCtrl', ['$scope', 'close', 'token', '$element', function ($scope, close, token, $element) {
  $scope.qrstring = token;

  $scope.closeModal = function () {
    $element.modal('hide');
    close(null, 500);
  };
}]);

app.controller('CompanyListCtrl', ['$scope', 'Api', 'settings',
  function ($scope, Api, settings) {
    $scope.objects = [];
    $scope.skip = 0;
    $scope.loadedAllCompanies = false;

    $scope.keysFilter = {
      available: {
        from: null,
        to: null
      },
      used: {
        from: null,
        to: null
      },
      remain: {
        from: null,
        to: null
      }
    }

    $scope.loadObjects = function (take, reset, filter) {
      var action = ($scope.q || filter) ? 'SearchServiceCompanies' : 'GetLatestRegisteredServiceCompanies';
      var request = {
        'Action': action,
        'Skip': $scope.skip,
        'Take': take,
        'SearchPhrase': $scope.q
      };

      if (filter) {
        request.availableFrom = filter.available.from;
        request.availableTo = filter.available.to;
        request.usedFrom = filter.used.from;
        request.usedTo = filter.used.to;
        request.remainFrom = filter.remain.from;
        request.remainTo = filter.remain.to;
      }

      Api.get(settings.API_URL, request, function (response) {
        $scope.skip += response.data.length;

        if (reset) {
          $scope.objects = response.data;
        } else {
          $scope.objects.push.apply($scope.objects, response.data);
        }

        $scope.loadedAllCompanies = response.data.length < take;
      });
    };

    $scope.$watch('q', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        $scope.skip = 0;
        $scope.loadObjects(20, true, $scope.keysFilter);
      }
    });

    $scope.$watch('keysFilter', function (newVal, oldVal) {
      if (!angular.equals(newVal, oldVal)) {
        $scope.skip = 0;
        $scope.loadObjects(20, true, newVal);
      }
    }, true);

    $scope.loadObjects(20, false);
  }
]);

app.controller('CompanyDetailCtrl', ['$scope', '$http', '$state', '$stateParams', 'ModalService', 'Api', 'settings', 'notify', '$filter',
  function ($scope, $http, $state, $stateParams, ModalService, Api, settings, notify, $filter) {
    if (!$stateParams.company) {
      $state.go('admin.company.list');
    }
    $scope.localServers = [];
    $scope.sipServers = [];
    $scope.company = $stateParams.company;
    $scope.isCreate = false;
    $scope.data = {
      acquiringTypes: [],
      merchantSettings: [],
      acquiringType: null
    };

    Api.get(settings.API_URL, { Action: 'GetNameRoles', serviceCompanyId: $scope.company.id }, function (response) {
      $scope.rolesList = response.data;
    });

    Api.get(settings.API_URL, { Action: 'GetBrandServiceCompanies' }, function (response) {
      $scope.brandsList = response.data;
    });

    $scope.save = function () {

      $scope.createOrUpdateLocalServers();

      var data = angular.extend({
        Action: 'UpdateServiceCompany',
        ServiceCompanyId: $scope.company.id
      }, angular.copy($scope.company));
      Api.post(settings.API_URL, data, function (response) {
        notify($filter('translate')('NOTIFY_COMPANY_UPDATED'));
        $state.go('admin.company.detail', { id: response.data.id, company: response.data });
      });
    };

    $scope.removeAdmin = function ($index) {
      var admin = $scope.company.admins[$index];
      if (admin.id) {
        Api.post(settings.API_URL, {
          Action: 'RemoveAdminsServiceCompany',
          ServiceCompanyId: $scope.company.id,
          Admins: [admin.id]
        }).then(function successCallback(response) {
          notify($filter('translate')('NOTIFY_ADMIN_DELETED'));
          $scope.company = response.data;
        });
      } else {
        $scope.company.admins.splice($index, 1);
      }
    };

    $scope.updateAdmins = function () {
      var updateAdmins = [];
      var addAdmins = [];

      angular.forEach($scope.company.admins, function (admin, i) {
        if (admin.id) {
          updateAdmins.push(admin);
        } else {
          addAdmins.push(admin);
        }
      });

      Api.post(settings.API_URL, {
        Action: 'UpdateAdminsServiceCompany',
        ServiceCompanyId: $scope.company.id,
        Admins: updateAdmins
      }).then(function successCallback(response) {
        notify($filter('translate')('NOTIFY_DATA_UPDATED'));
        $scope.company = response.data;
      });

      Api.post(settings.API_URL, {
        Action: 'AddAdminsServiceCompany', ServiceCompanyId:
        $scope.company.id,
        Admins: addAdmins
      }).then(function successCallback(response) {
        $scope.company = response.data;
      });
    };

    $scope.createOrUpdateLocalServers = function () {

      if ($scope.localServers) {

        Api.post(settings.API_URL, {
          Action: 'CreateOrUpdateLocalServers',
          ServiceCompanyId: $scope.company.id,
          LocalServers: $scope.localServers
        }).then(function successCallback(response) {
          notify($filter('translate')('NOTIFY_LOCALSERVERS_UPDATED'));
          $scope.localServers = response.data;
        });
      }
    };

    $scope.getLocalServers = function () {

      $scope.isLocalServersData = false;
      Api.post(settings.API_URL, {
        Action: 'GetLocalServers',
        ServiceCompanyId: $scope.company.id
      }).then(function successCallback(response) {
        if (response.data != 'null') {
          $scope.localServers = response.data;
          $scope.isLocalServersData = true;
        }
      });
    };

    $scope.removeLocalServer = function ($index) {

      if (confirm($filter('translate')('NOTIFY_MESSAGE_LOCALSERVER_DELETE_CONFIRM'))) {

        var localServer = $scope.localServers[$index];
        if (localServer.id) {
          Api.post(settings.API_URL, {
            Action: 'UnregisterLocalServer',
            ServiceCompanyId: $scope.company.id,
            LocalServerId: localServer.id
          }).then(function successCallback(response) {
            notify($filter('translate')('NOTIFY_LOCALSERVER_DELETED'));
            $scope.localServers.splice($index, 1);
          });
        } else {
          $scope.localServers.splice($index, 1);
        }
      }
    };

    $scope.updateLocalServerToken = function (localServerId) {

      if (localServerId) {

        Api.post(settings.API_URL, {
          Action: 'RefreshLocalServerToken',
          LocalServerId: localServerId
        }).then(function successCallback(response) {
          angular.forEach($scope.localServers, function (localServer, i) {
            if (localServer.id == localServerId) {
              localServer.localServerApiKey = response.data.apiKey;
            }
          });
          notify($filter('translate')('NOTIFY_DATA_UPDATED'));
        });
      }
    };

    if ($scope.company.id) {
      $scope.getLocalServers();
    }

    $scope.createOrUpdateSipServers = function () {
      if (!$scope.isSipServersValid()) {
        return;
      }

      const newServers = $scope.sipServers.filter(s => !s.sipServerId);
      const existing = $scope.sipServers.filter(s => !!s.sipServerId);

      const calls = [];

      newServers.forEach(sip => {
        calls.push(
          Api.post(settings.API_URL, {
            Action: 'RegisterSipServer',
            ServiceCompanyId: $scope.company.id,
            Name: sip.sipServerName,
            Host: sip.host,
            Description: sip.description,
          }).then(resp => {
            angular.extend(sip, resp.data);
          })
        );
      });

      existing.forEach(sip => {
        calls.push(
          Api.post(settings.API_URL, {
            Action: 'EditSipServer',
            ServiceCompanyId: $scope.company.id,
            Name: sip.sipServerName,
            Host: sip.host,
            Description: sip.description,
            SipServerId: sip.sipServerId
          }).then(resp => {
            angular.extend(sip, resp.data);
          })
        );
      });

      $q.all(calls).then(() => {
        notify($filter('translate')('NOTIFY_SIPSERVERS_UPDATED'));
      });
    };

    $scope.getSipServers = function () {
      $scope.isSipServersData = false;
      Api.get(settings.API_URL, {
        Action: 'GetRegisteredSipServers',
        ServiceCompanyId: $scope.company.id      // back‑end can ignore if unused
      }).then(function (resp) {
        if (resp.data !== 'null') {
          $scope.sipServers = resp.data;
          $scope.isSipServersData = true;
        }
      });
    };

    $scope.removeSipServer = function ($index) {
      if (confirm($filter('translate')('NOTIFY_MESSAGE_SIPSERVER_DELETE_CONFIRM'))) {
        var sip = $scope.sipServers[$index];
        if (sip.sipServerId) {
          Api.post(settings.API_URL, {
            Action: 'UnregisterSipServer',
            SipServerId: sip.sipServerId
          }).then(function () {
            notify($filter('translate')('NOTIFY_SIPSERVER_DELETED'));
            $scope.sipServers.splice($index, 1);
          });
        } else {
          $scope.sipServers.splice($index, 1);
        }
      }
    };

    $scope.updateSipServerToken = function (sipServerId) {
      if (sipServerId) {
        Api.post(settings.API_URL, {
          Action: 'RefreshSipServerToken',
          SipServerId: sipServerId
        }).then(function (resp) {
          angular.forEach($scope.sipServers, function (srv) {
            if (srv.id === sipServerId) {
              srv.authToken = resp.data.authToken;
            }
          });
          notify($filter('translate')('NOTIFY_DATA_UPDATED'));
        });
      }
    };

    $scope.isNameUnique = function(current) {
      var matches = $scope.sipServers.filter(function(s) {
        return s.sipServerName === current.sipServerName;
      });
      return matches.length <= 1;
    };

    $scope.isHostUnique = function(current) {
      var matches = $scope.sipServers.filter(function(s) {
        return s.host === current.host;
      });
      return matches.length <= 1;
    };

    $scope.isDescriptionValid = function(current) {
      return !current.description || current.description.length <= 200;
    };

    $scope.isServerValid = function(current) {
      return current.sipServerName &&
        current.sipServerName.length <= 50 &&
        $scope.isNameUnique(current) &&
        current.host &&
        $scope.isHostUnique(current) &&
        $scope.isDescriptionValid(current);
    };

    $scope.isSipServersValid = function() {
      return Array.isArray($scope.sipServers) &&
        $scope.sipServers.length > 0 &&
        $scope.sipServers.every($scope.isServerValid);
    };


    if ($scope.company.id) {
      $scope.getSipServers();
    }

    $scope.getQRCode = function (token) {
      ModalService.showModal({
        templateUrl: settings.TEMPLATE_DIR + 'company/qr_modal.html',
        controller: "TokenQrCodeCtrl",
        inputs: { token }
      }).then(function (modal) {
        modal.element.modal();
      });
    }

    $scope.getApiImg = function (id) {
      return settings.API_GET_IMAGE_URL + id;
    }

    $scope.uploadLocalServerImage = function (files, localServerId, i) {
      var file = files[0];
      var reader = new FileReader();
      var base64string = '';
      reader.onload = function () {
        base64string = reader.result.replace('data:image/jpeg;base64,', '');
        base64string = base64string.replace('data:image/png;base64,', '');
        if (typeof base64string === 'string') {
          Api.post(settings.API_URL, {
            Action: 'UploadImage',
            FileName: files[0].name,
            Content: base64string
          }).then(function (response) {
            angular.forEach($scope.localServers, function (localServer, j) {
              if (localServer.id == localServerId) {
                if (!localServer.parkingSpace.pictures || localServer.parkingSpace.pictures.length !== 5) {
                  localServer.parkingSpace.pictures = [null, null, null, null, null]
                }
                localServer.parkingSpace.pictures[i] = response.data.id;
                $scope.save();
              }
            });
          })
        }
      };
      reader.readAsDataURL(file);

    }

    $scope.createMerchantSetting = function (acquiringType) {
      if (acquiringType) {
        var data = angular.extend({
          Action: 'CreateMerchantSetting',
          ServiceCompanyId: $scope.company.id,
          AcquiringType: acquiringType
        });
        Api.post(settings.API_URL, data, function (response) {
          $scope.data.merchantSettings.push(response.data);
        });
        $scope.data.acquiringType = null;
      }
    };

    $scope.deleteMerchantSetting = function (obj, index) {
      if (confirm('Вы уверены?')) {
        $scope.data.merchantSettings.splice(index, 1);
        var data = angular.extend({
          Action: 'DeleteMerchantSetting',
          MerchantSettingId: obj.id
        });
        Api.post(settings.API_URL, data);
      }
    };

    $scope.updateMerchantSettings = function (obj) {
      var index = _.findIndex($scope.data.merchantSettings, { id: obj.id });
      if (index !== -1) {
        $scope.data.merchantSettings[index] = obj;
      }
    };

    $scope.editMerchantSettings = function (obj) {
      ModalService.showModal({
        templateUrl: settings.TEMPLATE_DIR + 'company/merchant_settings.html',
        controller: 'UpdateMerchantSettingCtrl',
        inputs: {
          obj: obj,
          onUpdate: $scope.updateMerchantSettings
        }
      }).then(function (modal) {
        modal.element.modal();
      });
    };

    Api.get(settings.API_URL, { Action: 'GetAcquiringTypes' }, function (response) {
      $scope.data.acquiringTypes = response.data;
    });

    Api.get(
      settings.API_URL,
      { Action: 'GetMerchantSettingsByServiceCompany', ServiceCompanyId: $scope.company.id },
      function (response) {
        $scope.data.merchantSettings = response.data;
      });
  }
]);

app.controller('CompanyCreateCtrl', ['$scope', '$state', 'Api', 'settings', 'notify', '$filter',
  function ($scope, $state, Api, settings, notify, $filter) {
    $scope.isCreate = true;

    $scope.company = {
      phoneNumbers: [''],
      admins: [],
      region: 'ru',
      brand: 'SmartAirkey'
    };

    Api.get(settings.API_URL, { Action: 'GetBrandServiceCompanies' }, function (response) {
      $scope.brandsList = response.data;
    });

    $scope.save = function () {
      var data = angular.copy($scope.company);
      Api.post(settings.API_URL, angular.extend({ Action: 'RegisterServiceCompany' }, data), function (response) {
        notify($filter('translate')('NOTIFY_COMPANY_ADDED'));
        $state.go('admin.company.detail', { id: response.data.id, company: response.data });
      });
    };
  }
]);


app.controller('UpdateMerchantSettingCtrl', ['$scope', '$state', 'Api', 'settings', 'notify', 'obj', 'close', '$element', 'onUpdate', '$filter',
  function ($scope, $state, Api, settings, notify, obj, close, $element, onUpdate, $filter) {
    $scope.obj = {
      id: obj.id,
      MerchantSettingId: obj.id,
      password: obj.password,
      token: obj.token,
      userName: obj.userName,
      enabled: obj.enabled || false
    };
    $scope.closeModal = function () {
      $element.modal('hide');
      close(null, 500);
    };

    $scope.save = function () {
      var data = angular.copy($scope.obj);
      Api.post(settings.API_URL, angular.extend({ Action: 'UpdateMerchantSetting' }, data), function (response) {
        notify($filter('translate')('NOTIFY_SETTINGS_UPDATED'));
        onUpdate(response.data);
        $scope.closeModal();
      });
    };
  }
]);
