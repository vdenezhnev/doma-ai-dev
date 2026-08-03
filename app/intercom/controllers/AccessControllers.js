app.controller('AccessCtrl', ['$scope', 'AccessObject', 'AccessPoint', 'User', 'settings',
    function($scope, AccessObject, AccessPoint, User, settings) {
        $scope.accessPoints = AccessPoint.grouped();
        $scope.accessObjects = AccessObject.query();
        $scope.navigate = {};
        $scope.selectedId = null;
        $scope.lockStates = {};

        var lockStateAbortController = null;
        var lockStateStreamStarted = false;

        function getSmartAirKeyAuthorization() {
            var inn = User.data && User.data.inn;
            var token = User.data
                && User.data.serviceCompanyApiKey
                && User.data.serviceCompanyApiKey.token;

            if (!inn || !token) {
                return null;
            }

            return btoa(inn + ':' + token);
        }

        function getAccessPointLockIds() {
            var result = {};
            var lockIds = [];

            angular.forEach($scope.accessPoints, function(points) {
                if (!angular.isArray(points)) {
                    return;
                }

                angular.forEach(points, function(point) {
                    if (point && point.lockId) {
                        result[point.lockId] = true;
                    }
                });
            });

            angular.forEach(result, function(value, lockId) {
                lockIds.push(lockId);
            });

            return lockIds;
        }

        function stopLockStateStream() {
            if (lockStateAbortController) {
                lockStateAbortController.abort();
                lockStateAbortController = null;
            }

            lockStateStreamStarted = false;
        }

        function parseLockStateEvent(eventText) {
            var jsonText = eventText
                .split(/\r?\n/)
                .filter(function(line) {
                    return line.indexOf('data:') === 0;
                })
                .map(function(line) {
                    return line.replace(/^data:\s?/, '');
                })
                .join('\n')
                .trim();

            if (!jsonText) {
                return null;
            }

            return JSON.parse(jsonText);
        }

        function applyLockState(state) {
            if (!state || !state.LockID || state.LockID === '(null)') {
                return;
            }

            $scope.lockStates[state.LockID] = angular.extend(
                $scope.lockStates[state.LockID] || {},
                state
            );
        }

        function startLockStateStream() {
            var authorization = getSmartAirKeyAuthorization();

            if (!authorization) {
                return;
            }

            if (!window.fetch || !window.TextDecoder || !window.AbortController) {
                return;
            }

            var lockIds = getAccessPointLockIds();

            if (!lockIds.length) {
                return;
            }

            stopLockStateStream();

            lockStateStreamStarted = true;
            lockStateAbortController = new AbortController();

            fetch(settings.ONLINE_API_URL + '/lockstate?locks=' + encodeURIComponent(lockIds.join(',')), {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream',
                    Authorization: 'Basic ' + authorization
                },
                signal: lockStateAbortController.signal
            }).then(function(response) {
                if (!response.ok || !response.body) {
                    lockStateStreamStarted = false;
                    return;
                }

                var reader = response.body.getReader();
                var decoder = new TextDecoder('utf-8');
                var buffer = '';

                function readStream() {
                    reader.read().then(function(result) {
                        if (result.done) {
                            lockStateStreamStarted = false;
                            return;
                        }

                        buffer += decoder.decode(result.value, { stream: true });

                        var events = buffer.split(/\r?\n\r?\n/);
                        buffer = events.pop();

                        angular.forEach(events, function(eventText) {
                            try {
                                var state = parseLockStateEvent(eventText);

                                if (state) {
                                    $scope.$applyAsync(function() {
                                        applyLockState(state);
                                    });
                                }
                            } catch (e) {
                                console.warn('Lock state parse error', e, eventText);
                            }
                        });

                        readStream();
                    }).catch(function(error) {
                        if (error && error.name === 'AbortError') {
                            return;
                        }

                        lockStateStreamStarted = false;
                        console.warn('Lock state stream read error', error);
                    });
                }

                readStream();
            }).catch(function(error) {
                if (error && error.name === 'AbortError') {
                    return;
                }

                lockStateStreamStarted = false;
                console.warn('Lock state stream error', error);
            });
        }

        function restartLockStateStreamAfterAccessPointsLoaded() {
            if ($scope.accessPoints && $scope.accessPoints.$promise) {
                $scope.accessPoints.$promise.then(function() {
                    startLockStateStream();
                });

                return;
            }

            startLockStateStream();
        }

        $scope.getLockStatusClass = function(accessPoint) {
            var lockId = accessPoint && accessPoint.lockId;
            var state = lockId && $scope.lockStates[lockId];

            if (!state || state.Connected === false || state.Status !== 'Online') {
                return 'lock-status-unavailable';
            }

            if (state.LockOpen === true) {
                return 'lock-status-open';
            }

            if (state.LockOpen === false) {
                return 'lock-status-closed';
            }

            return 'lock-status-unavailable';
        };

        $scope.getLockStatusTitle = function(accessPoint) {
            var lockId = accessPoint && accessPoint.lockId;
            var state = lockId && $scope.lockStates[lockId];

            if (!lockId) {
                return 'Lock ID не задан';
            }

            if (!state) {
                return 'Статус замка ещё не получен';
            }

            if (state.Connected === false || state.Status !== 'Online') {
                return 'Замок недоступен';
            }

            if (state.LockOpen === true) {
                return 'Замок открыт';
            }

            if (state.LockOpen === false) {
                return 'Замок закрыт';
            }

            return 'Статус замка неизвестен';
        };

        $scope.$on('updateObject', function (event, data) {
            $scope.accessObjects = AccessObject.query();
            $scope.$emit('updateObjects');
        });

        $scope.$on('updatePoint', function (event, data) {
            $scope.accessPoints = AccessPoint.grouped();
            $scope.$emit('updateObjects');
            restartLockStateStreamAfterAccessPointsLoaded();
        });

        $scope.$on('$destroy', function() {
            stopLockStateStream();
        });

        restartLockStateStreamAfterAccessPointsLoaded();
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
                $state.current.showConfirmation = false;
                $state.go('admin.access');
                notify(gettextCatalog.getString('devices.device_updated'));
            });
        };

        $scope.showApplyMessageCall = function() {
            $scope.showApplyMessage = true;
            window.scrollTo(0,0);
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

app.controller('AddAccessPerimeterCtrl', ['$scope', '$state', '$stateParams', 'AccessPerimeter', 'notify', 'gettextCatalog', 'ModalService', 'settings',
    function($scope, $state, $stateParams, AccessPerimeter, notify, gettextCatalog, ModalService, settings) {
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

        $scope.openQrModalWindow = () => {
            ModalService.showModal({
                templateUrl: settings.TEMPLATE_DIR + 'access/perimeter/generate-qr.html',
                controller: 'PerimeterGenerateQRModalCtrl',
                inputs: {
                    perimeterId: $scope.perimeter.id,
                }
            }).then(function(modal) {
                modal.element.modal();
            });
        };
    }
]);

app.controller('EditAccessPerimeterCtrl', [
    '$scope',
    '$state',
    '$stateParams',
    '$http',
    '$q',
    'User',
    'AccessPoint',
    'AccessPerimeter',
    'notify',
    'gettextCatalog',
    'ModalService',
    'settings',
    function(
        $scope,
        $state,
        $stateParams,
        $http,
        $q,
        User,
        AccessPoint,
        AccessPerimeter,
        notify,
        gettextCatalog,
        ModalService,
        settings
    ) {
        if (!$stateParams.object) {
            $state.go('admin.access');
            return;
        }

        $scope.isRootPerimeter = $stateParams.object.parentId === '00000000-0000-0000-0000-000000000000';

        $scope.accessObject = $stateParams.accessObject;
        $scope.perimeter = new AccessPerimeter($stateParams.object);
        $scope.title = $scope.perimeter.displayName;

        $scope.perimeterControl = {
            seconds: 3,
            inProgress: false,
            loading: false,
            points: [],
            selected: {}
        };

        function collectPerimeterIds(perimeter, result) {
            result = result || {};

            if (!perimeter || !perimeter.id) {
                return result;
            }

            result[perimeter.id] = true;

            angular.forEach(perimeter.child || [], function(childPerimeter) {
                collectPerimeterIds(childPerimeter, result);
            });

            return result;
        }

        function collectPerimeterNames(perimeter, result) {
            result = result || {};

            if (!perimeter || !perimeter.id) {
                return result;
            }

            result[perimeter.id] = perimeter.displayName;

            angular.forEach(perimeter.child || [], function(childPerimeter) {
                collectPerimeterNames(childPerimeter, result);
            });

            return result;
        }

        function buildPerimeterControlPoints(accessPointsByPerimeter) {
            var perimeterIds = collectPerimeterIds($scope.perimeter);
            var perimeterNames = collectPerimeterNames($scope.perimeter);
            var addedLockIds = {};
            var points = [];

            angular.forEach(perimeterIds, function(value, perimeterId) {
                angular.forEach(accessPointsByPerimeter[perimeterId] || [], function(point) {
                    if (!point || !point.lockId || addedLockIds[point.lockId]) {
                        return;
                    }

                    addedLockIds[point.lockId] = true;

                    points.push({
                        id: point.id,
                        displayName: point.displayName,
                        lockId: point.lockId,
                        perimeterId: point.perimeterId,
                        perimeterDisplayName: perimeterNames[point.perimeterId]
                    });

                    if ($scope.perimeterControl.selected[point.lockId] === undefined) {
                        $scope.perimeterControl.selected[point.lockId] = true;
                    }
                });
            });

            return points;
        }

        $scope.loadPerimeterControlPoints = function() {
            $scope.perimeterControl.loading = true;

            var accessPointsByPerimeter = AccessPoint.grouped();

            return accessPointsByPerimeter.$promise.then(function() {
                $scope.perimeterControl.points = buildPerimeterControlPoints(accessPointsByPerimeter);
            }, function() {
                notify({
                    message: 'Не удалось получить список контроллеров зоны доступа',
                    classes: 'alert-danger'
                });
            }).finally(function() {
                $scope.perimeterControl.loading = false;
            });
        };

        $scope.selectAllPerimeterControllers = function() {
            angular.forEach($scope.perimeterControl.points, function(point) {
                $scope.perimeterControl.selected[point.lockId] = true;
            });
        };

        $scope.deselectAllPerimeterControllers = function() {
            angular.forEach($scope.perimeterControl.points, function(point) {
                $scope.perimeterControl.selected[point.lockId] = false;
            });
        };

        $scope.getSelectedPerimeterControllersCount = function() {
            var count = 0;

            angular.forEach($scope.perimeterControl.points, function(point) {
                if ($scope.perimeterControl.selected[point.lockId]) {
                    count++;
                }
            });

            return count;
        };

        function getSelectedPoints() {
            var selectedPoints = [];

            angular.forEach($scope.perimeterControl.points, function(point) {
                if (point.lockId && $scope.perimeterControl.selected[point.lockId]) {
                    selectedPoints.push(point);
                }
            });

            return selectedPoints;
        }

        function openLock(point, seconds) {
            return $http.post(settings.API_URL, {
                Action: 'OpenAccessPointLock',
                AccessPointId: point.id,
                Seconds: seconds
            }).then(function() {
                return {
                    success: true,
                    lockId: point.lockId
                };
            }, function(error) {
                return {
                    success: false,
                    lockId: point.lockId,
                    error: error
                };
            });
        }

        $scope.unlockSelectedPerimeterControllers = function() {
            var seconds = Number($scope.perimeterControl && $scope.perimeterControl.seconds);

            if (!seconds || seconds <= 0) {
                notify({
                    message: 'Время открытия должно быть больше 0 секунд',
                    classes: 'alert-danger'
                });
                return;
            }

            var loadPromise = $scope.perimeterControl.points.length
                ? $q.when()
                : $scope.loadPerimeterControlPoints();

            $scope.perimeterControl.inProgress = true;

            loadPromise.then(function() {
                var selectedPoints = getSelectedPoints();

                if (!selectedPoints.length) {
                    notify({
                        message: 'Выберите хотя бы один контроллер',
                        classes: 'alert-warning'
                    });
                    return;
                }

                var requests = selectedPoints.map(function(point) {
                    return openLock(point, seconds);
                });

                return $q.all(requests).then(function(results) {
                    var successCount = 0;
                    var errorCount = 0;

                    angular.forEach(results, function(result) {
                        if (result.success) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    });

                    if (errorCount > 0) {
                        notify({
                            message: 'Открыто контроллеров: ' + successCount + '. Ошибок: ' + errorCount,
                            classes: 'alert-warning'
                        });
                    } else {
                        notify('Открыто контроллеров: ' + successCount);
                    }
                });
            }).finally(function() {
                $scope.perimeterControl.inProgress = false;
            });
        };

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

        $scope.openQrModalWindow = () => {
            ModalService.showModal({
                templateUrl: settings.TEMPLATE_DIR + 'access/perimeter/generate-qr.html',
                controller: 'PerimeterGenerateQRModalCtrl',
                inputs: {
                    perimeterId: $scope.perimeter.id,
                }
            }).then(function(modal) {
                modal.element.modal();
            });
        };

        $scope.loadPerimeterControlPoints();
    }
]);

app.controller('PerimeterGenerateQRModalCtrl', ['$scope', 'settings', 'notify', 'close', '$element', 'AccessPerimeter', 'perimeterId',
    function($scope, settings, notify, close, $element, AccessPerimeter, perimeterId) {
        $scope.qrConfig = {};
        $scope.closeModal = function() {
            $element.modal('hide');
            close(null, 500);
        };
        $scope.submitted = false;

        $scope.$watch('qrConfig.addressId', value => {
            $scope.QRgenerationForm.addressId.$setValidity('required', !!value);
        });
        $scope.$watch('qrConfig.tariffPolicyId', value => {
            $scope.QRgenerationForm.tariffPolicyId.$setValidity('required', !!value);
        });

        $scope.save = function() {
            AccessPerimeter.generateQR(angular.extend({
                perimeterId: perimeterId
            }, $scope.qrConfig))
                .$promise
                .then((pdf) => {
                    const blob = new Blob([pdf.data], { type: 'text/html'});
                    var anchor = document.createElement('a');
                    anchor.href = URL.createObjectURL(blob);
                    anchor.download = 'qr';
                    document.body.appendChild(anchor); //For FF
                    anchor.target = '_blank';
                    anchor.click();
                    document.body.removeChild(anchor);

                    $scope.closeModal();
                }, err => notify({
                    message: err.error,
                    classes: 'alert-danger'
                }));
        };
    }
]);

app.controller('AddAccessPointCtrl', ['$scope', '$state', '$stateParams', 'AccessPoint', 'PostamatAccessPoint', 'notify', 'gettextCatalog',
    function($scope, $state, $stateParams, AccessPoint, PostamatAccessPoint, notify, gettextCatalog) {
        $scope.perimeter = $stateParams.parentPerimeter;

        if (!$scope.perimeter) {
            $state.go('admin.access');
            return;
        }

        $scope.point = new AccessPoint();
        $scope.point.isPostamatAccessPoint = false;
        if ($scope.perimeter) {
            $scope.point.PerimeterId = $scope.perimeter.id;
        }

        $scope.submit = function () {
            if ($scope.point.isPostamatAccessPoint) {
                var postamatPoint = new PostamatAccessPoint();

                if ($scope.perimeter) {
                    postamatPoint.PerimeterId = $scope.perimeter.id;
                }

                postamatPoint.postamatId = $scope.point.postamatId;
                postamatPoint.displayName = $scope.point.displayName;
                postamatPoint.description = $scope.point.description;
                postamatPoint.$save(onAfterSave);
            } else {
                $scope.point.$save(onAfterSave);
            }
        };

        function onAfterSave() {
            $scope.$emit('updatePoint');
            $state.go('admin.access');
            notify(gettextCatalog.getString('devices.device_updated'));
        }
    }
]);

app.controller('EditAccessPointCtrl', ['$scope', '$state', '$http', 'User', 'AccessPoint', 'PostamatAccessPoint', 'notify', 'gettextCatalog', 'settings', 'point',
    function($scope, $state, $http, User, AccessPoint, PostamatAccessPoint, notify, gettextCatalog, settings, point) {
        var vm = this;

        vm.isEditPoint = true;

        $scope.isEditPoint = true;
        $scope.point = point;
        $scope.lockSchedulePoints = [{
            id: point.id,
            displayName: point.displayName,
            lockId: point.lockId
        }];

        $scope.unlock = {
            seconds: 3
        };

        $scope.unlockController = function () {
            var accessPointId = $scope.point && $scope.point.id;
            var lockId = $scope.point && $scope.point.lockId;
            var seconds = Number($scope.unlock && $scope.unlock.seconds);

            if (!lockId) {
                notify({
                    message: 'Не заполнен Lock ID контроллера',
                    classes: 'alert-danger'
                });
                return;
            }

            if (!seconds || seconds <= 0) {
                notify({
                    message: 'Время разблокировки должно быть больше 0 секунд',
                    classes: 'alert-danger'
                });
                return;
            }

            $http.post(settings.API_URL, {
                Action: 'OpenAccessPointLock',
                AccessPointId: accessPointId,
                Seconds: seconds
            }).then(function () {
                notify('Контроллер разблокирован');
            }, function (error) {
                notify({
                    message: error && error.data && error.data.error
                        ? error.data.error
                        : 'Ошибка разблокировки контроллера',
                    classes: 'alert-danger'
                });
            });
        };

        $scope.point.isPostamatAccessPoint = !!point.postamatId;
        $scope.title = $scope.point.displayName;

        if (!$scope.point.isPostamatAccessPoint) {
            $scope.deviceSettings = point.defaultKeySettings;
            $scope.deviceKeyUsage = point.keyUsage.restrictions;
            $scope.transports = point.transports;

            var gsmTransport = !!$scope.transports.length && $scope.transports.find(item => item.type === 'gsm');
            vm.isDisabledPaymentDate = !Boolean(gsmTransport) || (gsmTransport && gsmTransport.isIntegratedSimCard);
            vm.isOpeningByInternet = !!point.isOpeningByInternet;
            vm.isOpeningByPhone = !!point.isOpeningByPhone;

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
                    // new AccessPoint.update({
                    //     'action': 'UpdateAccessPointDefaultKeySettings',
                    //     'accessPointId': $scope.point.id,
                    //     'defaultKeySettings': $scope.deviceSettings
                    // }, function (response) {
                    //     /*notify(gettextCatalog.getString('devices.device_updated'));*/
                    // });
                    //
                    // new AccessPoint.update({
                    //     'action': 'UpdateAccessPointKeyUsage',
                    //     'accessPointId': $scope.point.id,
                    //     'keyUsage': {
                    //         'restrictions': $scope.deviceKeyUsage
                    //     }
                    // }, function (response) {
                    //     /*notify(gettextCatalog.getString('devices.device_updated'));*/
                    // });

                    $scope.point.isOpeningByInternet = vm.isOpeningByInternet;
                    $scope.point.isOpeningByPhone = vm.isOpeningByPhone;
                    $scope.point.transports = $scope.transports;
                    $scope.point.$save(function () {
                        $scope.$emit('updatePoint');
                        notify(gettextCatalog.getString('devices.device_updated'));
                    });

                }
            };
        }

        $scope.submit = function () {
            if ($scope.point.isPostamatAccessPoint) {
                var postamatPoint = new PostamatAccessPoint();

                Object.assign(postamatPoint, $scope.point);
                postamatPoint.$save(function() {
                    onAfterSave(gettextCatalog.getString('devices.device_updated'));
                });
            } else {
                $scope.point.$save(function () {
                    onAfterSave(gettextCatalog.getString('devices.device_updated'));
                });
            }
        };

        $scope.delete = function () {
            if (window.confirm(gettextCatalog.getString('devices.device_delete_confirm'))) {
                if ($scope.point.isPostamatAccessPoint) {
                    var postamatPoint = new PostamatAccessPoint();

                    postamatPoint.id = $scope.point.id;
                    postamatPoint.$delete(function() {
                        onAfterSave(gettextCatalog.getString('devices.device_deleted'));
                    });
                } else {
                    $scope.point.$delete(function () {
                        onAfterSave(gettextCatalog.getString('devices.device_deleted'));
                    });
                }
            }
        };

        function onAfterSave(notifyString) {
            $scope.$emit('updatePoint');
            $state.go('admin.access');
            notify(notifyString);
        }
    }
]);
