app.controller('AccountProfileCtrl', ['$scope', '$controller', '$state', '$http', 'User', 'settings', 'notify', 'gettextCatalog', 'ModalService',
    function($scope, $controller, $state, $http, User, settings, notify, gettextCatalog, ModalService) {
        $scope.rolesList = [];
        $scope.objectKey = {};

        function applyObjectKeyData(data) {
            $scope.objectKey = {
                objectName: data.objectName,
                pid: data.pid,
                masterKeyToken: data.masterKeyToken
            };
            return $scope.objectKey;
        }

        function showObjectKeyModal(data) {
            ModalService.showModal({
                templateUrl: settings.TEMPLATE_DIR + 'modals/access-object-master-key.html?v=3',
                controller: 'AccessObjectMasterKeyModalCtrl',
                inputs: {
                    masterKeyData: {
                        objectName: data.objectName || gettextCatalog.getString('html.account.object_key.title'),
                        pid: data.pid,
                        masterKeyToken: data.masterKeyToken
                    }
                }
            }).then(function (modal) {
                modal.element.modal();
            });
        }

        function loadObjectKey() {
            return $http.get(settings.API_URL + '?action=GetObjectKey')
                .then(function (response) {
                    return applyObjectKeyData(response.data);
                }, function (response) {
                    var message = gettextCatalog.getString('html.account.object_key.load_error');
                    if (response.data && response.data.error) {
                        message = response.data.error;
                    }
                    notify({
                        message: message,
                        classes: 'alert-danger'
                    });
                    return null;
                });
        }

        User.updateKeyCountInfo()
            .then(function() {
                $scope.userData = angular.copy(User.data);
                return $http.get(settings.API_URL + '?action=GetNameRoles');
            })
            .then(function(response) {
                $scope.rolesList = response.data;
                return loadObjectKey();
            });

        $scope.$on('accountObjectKeyUpdated', function (event, data) {
            if (data) {
                applyObjectKeyData(data);
            }
        });

        $scope.save = function() {
            $http.post(settings.API_URL, angular.extend({Action: 'UpdateServiceCompany'}, $scope.userData))
                .then(function successCallback(response) {
                    notify(gettextCatalog.getString('account.profile_updated'));
                    User.data = response.data;
                    $scope.userData = angular.copy(User.data);
                });
        };

        // backward compatibility for cached/old form.html with generateObjectKey button
        $scope.generateObjectKey = function () {
            loadObjectKey().then(function (data) {
                if (data) {
                    showObjectKeyModal(data);
                }
            });
        };

        $scope.removeAdmin = function($index) {
            var admin = $scope.userData.admins[$index];
            if (admin.id) {
                $http.post(settings.API_URL, {Action: 'RemoveAdminsServiceCompany', Admins: [admin.id]})
                    .success(function (response) {
                        notify(gettextCatalog.getString('account.admin_deleted'));
                        User.data = response;
                        $scope.userData = angular.copy(User.data);
                    });
            }
            else {
                $scope.userData.admins.splice($index, 1);
            }
        };

        $scope.updateAdmins = function () {
            var updateAdmins = [];
            var addAdmins = [];

            angular.forEach($scope.userData.admins, function (admin) {
                if (admin.id) {
                    updateAdmins.push(admin);
                }
                else {
                    addAdmins.push(admin);
                }
            });

            $http.post(settings.API_URL, {Action: 'UpdateAdminsServiceCompany', Admins: updateAdmins})
                .then(function successCallback(response) {
                    notify(gettextCatalog.getString('account.profile_updated'));
                    User.data = response.data;
                    $scope.userData = angular.copy(User.data);
                });

            $http.post(settings.API_URL, {Action: 'AddAdminsServiceCompany', Admins: addAdmins})
                .then(function successCallback(response) {
                    User.data = response.data;
                    $scope.userData = angular.copy(User.data);
                });
        };

        $controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: $scope.userData
        });
    }
]);

app.controller('AccountChangePasswordCtrl', ['$scope', '$http', 'Session', 'settings', 'notify', 'gettextCatalog',
    function($scope, $http, Session, settings, notify, gettextCatalog) {
        $scope.save = function() {
            $http.post(settings.API_URL, {
                Action: 'ChangePassword',
                OldPassword: Base64.encode($scope.OldPassword),
                NewPassword: Base64.encode($scope.NewPassword)
            })
            .then(function successCallback(response) {
                notify(gettextCatalog.getString('account.password_changed'));
                Session.token = response.data.apiKeyId + ':' + response.data.token;
            });
        };
    }
]);
