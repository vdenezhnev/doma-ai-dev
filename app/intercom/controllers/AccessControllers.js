
app.controller('AccessCtrl', ['$scope', '$http', 'AccessObject', 'AccessPoint', '$timeout',
    function($scope, $http, AccessObject, AccessPoint, $timeout) {
        $scope.accessPoints = AccessPoint.grouped();
        $scope.accessObjects = AccessObject.query();
        $scope.navigate = {};
        $scope.selectedId = null;

        $scope.$on('updateObject', function (event, data) {
            $scope.accessObjects = AccessObject.query();
            $scope.$emit('updateObjects');
        });

        $scope.$on('updatePoint', function (event, data) {
            $scope.accessPoints = AccessPoint.grouped();
            $scope.$emit('updateObjects');
        });
    }
]);

app.controller('AddAccessObjectCtrl', ['$scope', '$http', '$state', 'AccessObject', 'notify', 'gettextCatalog', 'Upload',
    function($scope, $http, $state, AccessObject, notify, gettextCatalog, Upload) {
        $scope.accessObject = new AccessObject();
        
        $scope.submit = function () {
            $scope.accessObject.$save(function () {
                $scope.$emit('updateObject');
                $state.go('admin.access');
                notify(gettextCatalog.getString('devices.device_updated'));
            });
        };
    }
]);

app.controller('EditAccessObjectCtrl', ['$scope', '$controller', '$rootScope', '$http', '$state', '$stateParams', 'AccessObject', 'notify', 'gettextCatalog', 'ImageUpload', 'Upload',
    function($scope, $controller, $rootScope, $http, $state, $stateParams, AccessObject, notify, gettextCatalog, ImageUpload, Upload) {

        if (!$stateParams.object) {
            $state.go('admin.access');
            return;
        }

        $rootScope.selectedId = $stateParams.object.id;
        $scope.accessObject = new AccessObject($stateParams.object);
        $scope.title = $scope.accessObject.displayName;
            
        $scope.submit = function () {
            $scope.accessObject.$save(function () {
                $scope.$emit('updateObject');
                $state.go('admin.access');
                notify(gettextCatalog.getString('devices.device_updated'));
            });
        };

        $scope.upload = function (file) {
            Upload.base64DataUrl(file).then(function(urls){
                ImageUpload.upload({
                    content: urls.split(',')[1], 
                    fileName: file.name
                }, function (response) {
                    $scope.accessObject.pictureId = response.id;
                });
            });

        };

        $controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: $scope.accessObject
        });
    }
]);

app.controller('AddAccessPerimeterCtrl', ['$scope', '$state', '$stateParams', '$http', 'AccessPerimeter', 'notify', 'gettextCatalog',
    function($scope, $state, $stateParams, $http, AccessPerimeter, notify, gettextCatalog) {
        $scope.accessObject = $stateParams.accessObject;
        $scope.parentPerimeter = $stateParams.parentPerimeter;

        $scope.perimeter = new AccessPerimeter();
        if ($scope.accessObject) {
            $scope.perimeter.AccessObjectId = $scope.accessObject.id;
        }
        if ($scope.parentPerimeter) {
            $scope.perimeter.ParentId = $scope.parentPerimeter.id;
        }

        $scope.submit = function () {
            $scope.perimeter.$save(function () {
                $scope.$emit('updateObject');
                $state.go('admin.access');
                notify(gettextCatalog.getString('devices.device_updated'));
            });
        }
    }
]);

app.controller('EditAccessPerimeterCtrl', ['$scope', '$controller', '$http', '$state', '$stateParams', 'AccessPerimeter', 'notify', 'gettextCatalog',
    function($scope, $controller, $http, $state, $stateParams, AccessPerimeter, notify, gettextCatalog) {
        if (!$stateParams.object) {
            $state.go('admin.access');
            return;
        }

        $scope.isRootPerimeter = $stateParams.object.parentId === '00000000-0000-0000-0000-000000000000';
        
        $scope.accessObject = $stateParams.accessObject;
        $scope.perimeter = new AccessPerimeter($stateParams.object);
        $scope.title = $scope.perimeter.displayName;

        $scope.submit = function () {
            $scope.perimeter.$save(function () {
                $scope.$emit('updateObject');
                $state.go('admin.access');
                notify(gettextCatalog.getString('devices.device_updated'));
            });
        };

        $scope.delete = function () {
            if (window.confirm(gettextCatalog.getString('devices.device_delete_confirm'))) {
                $scope.perimeter.$delete(function () {
                    $scope.$emit('updateObject');
                    $state.go('admin.access');
                    notify(gettextCatalog.getString('devices.device_updated'));
                });
            }
        };
    }
]);

app.controller('AddAccessPointCtrl', ['$scope', '$state', '$stateParams', '$http', 'AccessPoint', 'notify', 'gettextCatalog',
    function($scope, $state, $stateParams, $http, AccessPoint, notify, gettextCatalog) {
        $scope.perimeter = $stateParams.parentPerimeter;

        if (!$scope.perimeter) {
            $state.go('admin.access');
            return;
        }

        $scope.point = new AccessPoint();
        if ($scope.perimeter) {
            $scope.point.PerimeterId = $scope.perimeter.id;
        }

        $scope.submit = function () {
            $scope.point.$save(function () {
                $scope.$emit('updatePoint');
                $state.go('admin.access');
                notify(gettextCatalog.getString('devices.device_updated'));
            });
        }
    }
]);

app.controller('EditAccessPointCtrl', ['$scope', '$controller', '$state', '$stateParams', '$http', 'AccessPoint', 'notify', 'gettextCatalog', 'point',
    function($scope, $controller, $state, $stateParams, $http, AccessPoint, notify, gettextCatalog, point) {
        $scope.point = point;
        $scope.title = $scope.point.displayName;
        $scope.deviceSettings = point.defaultKeySettings;
        $scope.deviceKeyUsage = point.keyUsage.restrictions;

        $scope.getKeyUsage = function(key) {
            var result = $.grep($scope.deviceKeyUsage, function(e){ return e.key == key; });
            if (result.length === 1) {
                return result[0];
            }
        };
        
        $scope.replace = function(lockId) {
            AccessPoint.replace({
                accessPointId: point.id,
                lockId: lockId
            }, function(response) {
                notify(gettextCatalog.getString('devices.device_updated'));
                $state.go('admin.device.detail', {id: response.id, device: response}, {reload: true});
            });
        };
        
        $scope.updateSettings = function() {
            if (window.confirm(gettextCatalog.getString('devices.device_update_settings'))) {
                new AccessPoint.update({
                    'action': 'UpdateAccessPointDefaultKeySettings',
                    'accessPointId': $scope.point.id,
                    'defaultKeySettings': $scope.deviceSettings
                }, function (response) {
                    notify(gettextCatalog.getString('devices.device_updated'));
                });

                new AccessPoint.update({
                    'action': 'UpdateAccessPointKeyUsage',
                    'accessPointId': $scope.point.id,
                    'keyUsage': {
                        'restrictions': $scope.deviceKeyUsage
                    }
                }, function (response) {
                    notify(gettextCatalog.getString('devices.device_updated'));
                });
            }
        };

        $scope.submit = function () {
            $scope.point.$save(function () {
                $scope.$emit('updatePoint');
                $state.go('admin.access');
                notify(gettextCatalog.getString('devices.device_updated'));
            });
        };

        $scope.delete = function () {
            if (window.confirm(gettextCatalog.getString('devices.device_delete_confirm'))) {
                $scope.point.$delete(function () {
                    $scope.$emit('updatePoint');
                    notify(gettextCatalog.getString('devices.device_deleted'));
                    $state.go('admin.access');
                });
            }
        };

        /*$controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: {
                point: $scope.point
            }
        });*/
    }
]);
