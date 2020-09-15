'use strict';

app.controller('ControlPanelUserListCtrl', ['$scope', '$http', 'settings', 'ControlPanelUser',
    function($scope, $http, settings, ControlPanelUser) {
        $scope.users = ControlPanelUser.query();
    }
]);

app.controller('ControlPanelUserDetailCtrl', ['$scope', '$state', '$stateParams', 'notify', 'AccessPoint', 'ControlPanelUser', 'gettextCatalog',
    function($scope, $state, $stateParams, notify, AccessPoint, ControlPanelUser, gettextCatalog) {
        if (!$stateParams.user) {
            return $state.go('admin.control_panel_user.list');
        }

        $scope.user = $stateParams.user;
        $scope.title = $scope.user.displayName;

        $scope.save = function() {
            var data = angular.copy($scope.user);
            data['password'] = Base64.encode($scope.user.password);

            new ControlPanelUser(data).$save().then(function(response) {
                notify(gettextCatalog.getString('notify.defaults.updated'));
                return $state.go('admin.control_panel_user.list');
            });
        };

        $scope.accessPoints = AccessPoint.query();

        $scope.delete = function () {
            if (window.confirm(gettextCatalog.getString('notify.defaults.are_you_sure'))) {
                var user = new ControlPanelUser({id: $scope.user.id});
                user.$delete().then(function(response) {
                    notify(gettextCatalog.getString('notify.defaults.removed'));
                    return $state.go('admin.control_panel_user.list');
                });
            }
        };
    }
]);


app.controller('ControlPanelUserCreateCtrl', ['$scope', '$state', 'notify', 'gettextCatalog', 'AccessPoint', 'ControlPanelUser',
    function($scope, $state, notify, gettextCatalog, AccessPoint, ControlPanelUser) {
        $scope.user = new ControlPanelUser({});

        $scope.save = function() {
            var data = angular.copy($scope.user);
            data['password'] = Base64.encode($scope.user.password);

            new ControlPanelUser(data).$save().then(function(response) {
                notify(gettextCatalog.getString('notify.defaults.created'));
                return $state.go('admin.control_panel_user.list');
            });
        };

        $scope.accessPoints = AccessPoint.query();
    }
]);
