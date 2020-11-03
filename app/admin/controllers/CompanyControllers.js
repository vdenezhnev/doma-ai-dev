'use strict';

app.controller('CompanyListCtrl', ['$scope', 'Api', 'settings',
    function($scope, Api, settings) {
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

        $scope.loadObjects = function(take, reset, filter) {
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

            Api.get(settings.API_URL, request, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.objects = response.data;
                }
                else {
                    $scope.objects.push.apply($scope.objects, response.data);
                }

                $scope.loadedAllCompanies = response.data.length < take;
            });
        };

        $scope.$watch('q', function(newVal, oldVal){
            if (newVal !== oldVal) {
                $scope.skip = 0;
                $scope.loadObjects(20, true, $scope.keysFilter);
            }
        });

        $scope.$watch('keysFilter', function(newVal, oldVal){
            if (!angular.equals(newVal, oldVal)) {
                $scope.skip = 0;
                $scope.loadObjects(20, true, newVal);
            }
        }, true);

        $scope.loadObjects(20, false);
    }
]);

app.controller('CompanyDetailCtrl', ['$scope', '$http', '$state', '$stateParams', 'ModalService', 'Api', 'settings', 'notify',
    function($scope, $http, $state, $stateParams, ModalService, Api, settings, notify) {
        if (!$stateParams.company) {
            $state.go('admin.company.list');
        }

        $scope.company = $stateParams.company;
        $scope.isCreate = false;
        $scope.data = {
            acquiringTypes: [],
            merchantSettings: [],
            acquiringType: null
        };

        $scope.save = function() {
            var data = angular.extend({
                Action: 'UpdateServiceCompany',
                ServiceCompanyId: $scope.company.id
            }, angular.copy($scope.company));
            Api.post(settings.API_URL, data, function(response) {
                notify('Компания обновлена');
                $state.go('admin.company.detail', {id: response.data.id, company: response.data});
            });
        };

        $scope.removeAdmin = function($index) {
            var admin = $scope.company.admins[$index];
            if (admin.id) {
                Api.post(settings.API_URL, {
                    Action: 'RemoveAdminsServiceCompany',
                    ServiceCompanyId: $scope.company.id,
                    Admins: [admin.id]
                }).then(function successCallback(response) {
                    notify(gettextCatalog.getString('Удален'));
                    $scope.company = response.data;
                });
            }
            else {
                $scope.company.admins.splice($index, 1);
            }
        };

        $scope.updateAdmins = function () {
            var updateAdmins = [];
            var addAdmins = [];

            angular.forEach($scope.company.admins, function (admin, i) {
                if (admin.id) {
                    updateAdmins.push(admin);
                }
                else {
                    addAdmins.push(admin);
                }
            });

            Api.post(settings.API_URL, {
                Action: 'UpdateAdminsServiceCompany',
                ServiceCompanyId: $scope.company.id,
                Admins: updateAdmins
            }).then(function successCallback(response) {
                notify('Данные обновлены');
                console.log(response);
                $scope.company = response.data;
            });

            Api.post(settings.API_URL, {
                Action: 'AddAdminsServiceCompany', ServiceCompanyId:
                $scope.company.id,
                Admins: addAdmins
            }).then(function successCallback(response) {
                console.log(response);
                $scope.company = response.data;
            });
        };

        $scope.createMerchantSetting = function(acquiringType) {
            if (acquiringType) {
                var data = angular.extend({
                    Action: 'CreateMerchantSetting',
                    ServiceCompanyId: $scope.company.id,
                    AcquiringType: acquiringType
                });
                Api.post(settings.API_URL, data, function(response) {
                    $scope.data.merchantSettings.push(response.data);
                });
                $scope.data.acquiringType = null;
            }
        };

        $scope.deleteMerchantSetting = function(obj, index) {
            if (confirm('Вы уверены?')) {
                $scope.data.merchantSettings.splice(index, 1);
                var data = angular.extend({
                    Action: 'DeleteMerchantSetting',
                    MerchantSettingId: obj.id
                });
                Api.post(settings.API_URL, data);
            }
        };

        $scope.updateMerchantSettings = function(obj) {
            var index = _.findIndex($scope.data.merchantSettings, {id: obj.id});
            if (index !== -1) {
                $scope.data.merchantSettings[index] = obj;
            }
        };

        $scope.editMerchantSettings = function(obj) {
            ModalService.showModal({
                templateUrl: settings.TEMPLATE_DIR + 'company/merchant_settings.html',
                controller: 'UpdateMerchantSettingCtrl',
                inputs: {
                    obj: obj,
                    onUpdate: $scope.updateMerchantSettings
                }
            }).then(function(modal) {
                modal.element.modal();
            });
        };

        Api.get(settings.API_URL, {Action: 'GetAcquiringTypes'}, function (response) {
            $scope.data.acquiringTypes = response.data;
        });

        Api.get(
            settings.API_URL, 
            {Action: 'GetMerchantSettingsByServiceCompany', ServiceCompanyId: $scope.company.id},
            function (response) {
              $scope.data.merchantSettings = response.data;
            });
    }
]);

app.controller('CompanyCreateCtrl', ['$scope', '$state', 'Api', 'settings', 'notify',
    function($scope, $state, Api, settings, notify) {
        $scope.isCreate = true;

        $scope.company = {
            phoneNumbers: [''],
            admins: []
        };

        $scope.save = function() {
            var data = angular.copy($scope.company);
            Api.post(settings.API_URL, angular.extend({Action: 'RegisterServiceCompany'}, data), function(response) {
                notify('Компания добавлена');
                $state.go('admin.company.detail', {id: response.data.id, company: response.data});
            });
        };
    }
]);


app.controller('UpdateMerchantSettingCtrl', ['$scope', '$state', 'Api', 'settings', 'notify', 'obj', 'close', '$element', 'onUpdate',
    function($scope, $state, Api, settings, notify, obj, close, $element, onUpdate) {
        $scope.obj = {
            id: obj.id,
            MerchantSettingId: obj.id,
            password: obj.password,
            token: obj.token,
            userName: obj.userName,
            enabled: obj.enabled || false
        };
        $scope.closeModal = function() {
            $element.modal('hide');
            close(null, 500);
        };

        $scope.save = function() {
            var data = angular.copy($scope.obj);
            Api.post(settings.API_URL, angular.extend({Action: 'UpdateMerchantSetting'}, data), function(response) {
                notify('Настройки обновлены');
                onUpdate(response.data);
                $scope.closeModal();
            });
        };
    }
]);
