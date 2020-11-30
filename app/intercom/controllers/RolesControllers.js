'use strict';

app.controller('RolesListCtrl', ['$scope', '$http', 'settings',
    function($scope, $http, settings) {
        $scope.roles = [];

        $http.get(settings.API_URL + '?action=GetRoles').then(function(response){
            $scope.roles = response.data;
        });
    }
]);

app.controller('RoleCreateCtrl', ['$scope', '$state', '$http', 'settings', 'gettextCatalog',
    function($scope, $state, $http, settings, gettextCatalog) {
        $scope.policesList = [
            {name: 'admin', displayName: gettextCatalog.getString('html.roles.admins_title')},
            {name: 'user', displayName: gettextCatalog.getString('html.roles.users_title')},
            {name: 'tarif', displayName: gettextCatalog.getString('html.roles.tariff_title')},
            {name: 'accsessPerimeterAndPoint', displayName: gettextCatalog.getString('html.roles.zones_title')},
            {name: 'rossetaLock', displayName: gettextCatalog.getString('html.roles.rossetaLock_title')},
            {name: 'address', displayName: gettextCatalog.getString('html.roles.address_title')},
            {name: 'accessJournal', displayName: gettextCatalog.getString('html.roles.accessJournal_title')},
            {name: 'controlPanel', displayName: gettextCatalog.getString('html.roles.controlPanel_title')},
            {name: 'accessRight', displayName: gettextCatalog.getString('html.roles.accessRight_title')},
            {name: 'payment', displayName: gettextCatalog.getString('html.roles.payment_title')},
            {name: 'role', displayName: gettextCatalog.getString('html.roles.roles_title')},
        ];

        $scope.save = function() {
            const params = {
                action: 'CreateRole',
                name: $scope.RolesForm.displayName.$modelValue,
                comment: $scope.RolesForm.comment.$modelValue,
                policies: [
                    ...$scope.policesList.filter(item => item.isChecked).map(item => item.name)
                ]
            };

            $http.post(settings.API_URL, params).then(function() {
                $state.go('admin.roles.list');
            });
        };
    }
]);

app.controller('RoleDetailCtrl', ['$scope', '$state', '$stateParams', 'notify', 'gettextCatalog', '$http', 'settings',
    function($scope, $state, $stateParams, notify, gettextCatalog, $http, settings) {
        $scope.policesList = [
            {name: 'admin', displayName: gettextCatalog.getString('html.roles.admins_title')},
            {name: 'user', displayName: gettextCatalog.getString('html.roles.users_title')},
            {name: 'tarif', displayName: gettextCatalog.getString('html.roles.tariff_title')},
            {name: 'accsessPerimeterAndPoint', displayName: gettextCatalog.getString('html.roles.zones_title')},
            {name: 'rossetaLock', displayName: gettextCatalog.getString('html.roles.rossetaLock_title')},
            {name: 'address', displayName: gettextCatalog.getString('html.roles.address_title')},
            {name: 'accessJournal', displayName: gettextCatalog.getString('html.roles.accessJournal_title')},
            {name: 'controlPanel', displayName: gettextCatalog.getString('html.roles.controlPanel_title')},
            {name: 'accessRight', displayName: gettextCatalog.getString('html.roles.accessRight_title')},
            {name: 'payment', displayName: gettextCatalog.getString('html.roles.payment_title')},
            {name: 'role', displayName: gettextCatalog.getString('html.roles.roles_title')},
        ];

        if (!$stateParams.role) {
            $state.go('admin.roles.list');
            return;
        }

        $scope.isAdminDefault = !!$stateParams.role.isAdminDefault;
        $scope.form = {
            name: $stateParams.role.name,
            comment: $stateParams.role.comment
        };

        angular.forEach($scope.policesList, function(value) {
            if ($stateParams.role.policies.includes(value.name)) {
                value.isChecked = true;
            }
        });

        $scope.save = function() {
            const params = {
                action: 'UpdateRole',
                id: $stateParams.role.id,
                name: $scope.RolesForm.displayName.$modelValue,
                comment: $scope.RolesForm.comment.$modelValue,
                policies: [
                    ...$scope.policesList.filter(item => item.isChecked).map(item => item.name)
                ]
            };

            $http.post(settings.API_URL, params).then(function() {
                $state.go('admin.roles.list');
            });
        };

        $scope.delete = function() {
            // gettextCatalog.getString('abonents.abonent_delete_confirm')
            if (!$scope.isAdminDefault && window.confirm(gettextCatalog.getString('html.roles.deleteRolesConfirm'))) {
                $http.post(settings.API_URL, {action: 'DeleteRole', id: $stateParams.role.id}).then(function () {
                    notify(gettextCatalog.getString('html.roles.deleteRolesSuccess'));
                    $state.current.showConfirmation = false;
                    $state.go('admin.roles.list');
                });
            }
        };

    }
]);
