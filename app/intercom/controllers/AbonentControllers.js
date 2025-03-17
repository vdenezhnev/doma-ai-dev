'use strict';

app.controller('AbonentListCtrl', ['$scope', '$http', '$httpParamSerializer', 'settings', 'Abonent', 'gettextCatalog', 'Camera',
    function($scope, $http, $httpParamSerializer, settings, Abonent, gettextCatalog, Camera) {
        $scope.filter = {};
        $scope.take = 20;
        $scope.objects = [];
        $scope.skip = 0;
        $scope.isLoadedAll = false;
        $scope.importedFile = null;
        $scope.importInfoTitle = gettextCatalog.getString('importInfoTitle');

        $scope.loadObjects = function(reset) {
            Abonent.query(angular.extend({skip: $scope.skip, take: $scope.take}, $scope.filter)).$promise.then(function(response) {
                $scope.skip += response.items.length;
                $scope.$emit('updateAddresses');

                if (reset) {
                    $scope.objects = response.items;
                }
                else {
                    $scope.objects.push.apply($scope.objects, response.items);
                }

                $scope.isLoadedAll = response.items.length < $scope.take;
            });
        };

        $scope.$watchCollection('filter', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                $scope.skip = 0;
                $scope.loadObjects(true);
            }
        });
        $scope.$watchCollection('importedFile', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                const fd = new FormData();
                fd.append('file', newVal);
                $scope.skip = 0;
                Abonent.import(fd).$promise
                    .then(() => $scope.loadObjects(true));
            }
        });

        $scope.loadObjects();

        $scope.downloadTemplate = function() {
            var getParams = angular.extend({action: 'DownloadImportAbonentsTemplate'});
            $http.get(settings.API_URL + '?' + $httpParamSerializer(getParams), {
                responseType: 'arraybuffer'
            }).success(function(data, status, headers) {
                headers = headers();

                var filename = 'abonent-import-template.xlsx';
                var contentType = headers.contentType;

                var linkElement = document.createElement('a');
                try {
                    var blob = new Blob([data], { type: contentType });
                    var url = window.URL.createObjectURL(blob);

                    linkElement.setAttribute('href', url);
                    linkElement.setAttribute("download", filename);

                    var clickEvent = new MouseEvent("click", {
                        "view": window,
                        "bubbles": true,
                        "cancelable": false
                    });
                    linkElement.dispatchEvent(clickEvent);
                } catch (ex) {
                }
            });
        };

        $scope.user.updateKeyCountInfo();
    }
]);

app.controller('AbonentCreateCtrl', ['$scope', '$state', 'Abonent', 'Device',
    function($scope, $state, Abonent, Device) {
        $scope.showRfid = false;
        $scope.abonent = new Abonent({
            cars: [],
            perimeters: [],
            temporaryAccessPerimeters: []
        });

        Abonent.getStatusCreateAbonentUser().$promise.then(function (response) {
            $scope.createAbonentUser = response.status;
        });

        $scope.save = function() {
            $scope.abonent.$save().then(function(response) {
                $state.go('admin.abonent.list');
            });
        };

        $scope.lowerFloorValidation = function() {
            var val = $scope.abonent.lowerFloor;
            if (val === '0') return;
            if (val === '-') return;
            if (val.length === 2) {
                if (val[0] === "0") {
                    $scope.abonent.lowerFloor = '0';
                    return;
                }
                if (Number(val) >= -5 && Number(val) <= 0) return;
                $scope.abonent.lowerFloor = '-';
                return;
            }
            if (val.length > 2) {
                $scope.abonent.lowerFloor = val.slice(0,2);
                return;
            }
            $scope.abonent.lowerFloor = '';
        };

        $scope.workingTimeStart = function () {
            var val = $scope.abonent.workingTime.start.replace(/[^0-9]/g, '');
            if (val.length === 2) {
                $scope.abonent.workingTime.start = val + ":";
                return;
            }
        }

        $scope.workingTimeEnd = function () {
            var val = $scope.abonent.workingTime.end.replace(/[^0-9]/g, '');
            if (val.length === 2) {
                $scope.abonent.workingTime.end = val + ":";
                return;
            }
        }

        $scope.onlyNumbersExternalId = function () {
            var val = $scope.abonent.externalId;
            $scope.abonent.externalId = val.replace(/[^0-9]/g, '');
        }

        $scope.onlyNumbersFloor = function () {
            var val = $scope.abonent.floor;
            $scope.abonent.floor = val.replace(/[^0-9]/g, '');
            if (val === "123456") {
                $scope.abonent.floor = 123456;
                return;
            }

            if (val > 200 && val !== 123456) $scope.abonent.floor = 200;
        }

        $scope.devices = Device.query();
    }
]);

app.controller('AbonentDetailCtrl', ['$rootScope', '$http', '$httpParamSerializer', '$scope', '$controller', '$state', '$stateParams', 'Abonent', 'notify', 'gettextCatalog', 'User', 'Camera', 'settings',
    function($rootScope, $http, $httpParamSerializer, $scope, $controller, $state, $stateParams, Abonent, notify, gettextCatalog, User, Camera, settings) {
        if (!$stateParams.abonent) {
            $state.go('admin.abonent.list');
            return;
        }

        $scope.isOld = true;

        $scope.endDateBeforeRender = endDateBeforeRender
        $scope.endDateOnSetTime = endDateOnSetTime
        $scope.startDateBeforeRender = startDateBeforeRender
        $scope.startDateOnSetTime = startDateOnSetTime

        function startDateOnSetTime () {
            $scope.$broadcast('start-date-changed');
        }

        function endDateOnSetTime () {
            $scope.$broadcast('end-date-changed');
        }



        function startDateBeforeRender ($view, $dates, $leftDate, $upDate, $rightDate, endDate) {
            if (endDate) {
                var activeDate = moment(new Date(endDate)).subtract(1, $view).add(1, 'minute');
                var weekBeforeEnd = moment(new Date(endDate)).subtract(7, 'day').subtract(1, $view).add(1, 'minute');
            }
            var now = moment(new Date()).subtract(1, $view).add(1, 'minute');
            var weekFromNow;
            if ($view === 'day') {
                weekFromNow = moment(new Date()).add(8, 'day').subtract(1, $view).add(1, 'minute');
            } else {
                weekFromNow = moment(new Date()).add(7, 'day').subtract(1, $view).add(1, 'minute');
            }
            $dates.filter(function (date) {
                if (activeDate) {
                    return date.localDateValue() <= now.valueOf()
                      || date.localDateValue() >= activeDate.valueOf()
                      || date.localDateValue() <= weekBeforeEnd.valueOf()
                      || date.localDateValue() >= weekFromNow.valueOf();
                }
                return date.localDateValue() <= now.valueOf() || date.localDateValue() >= weekFromNow.valueOf();
            }).forEach(function (date) {
                date.selectable = false;
            })
        }

        function endDateBeforeRender ($view, $dates, $leftDate, $upDate, $rightDate, startDate, endDate) {
                if (startDate) {
                    var activeDate = moment(new Date(startDate)).subtract(1, $view).add(1, 'minute');
                }
                var now = moment(new Date()).subtract(1, $view).add(1, 'minute');
                var weekFromNow;
                if ($view === 'day') {
                    weekFromNow = moment(new Date()).add(8, 'day').subtract(1, $view).add(1, 'minute');
                } else {
                    weekFromNow = moment(new Date()).add(7, 'day').subtract(1, $view).add(1, 'minute');
                }
                $dates.filter(function (date) {
                    if (activeDate) {
                        return date.localDateValue() <= now.valueOf()
                          || date.localDateValue() <= activeDate.valueOf()
                          || date.localDateValue() >= weekFromNow.valueOf();
                    }
                    return date.localDateValue() <= now.valueOf() || date.localDateValue() >= weekFromNow.valueOf();
                }).forEach(function (date) {
                    date.selectable = false;
                })
        }

        $scope.abonent = new Abonent(angular.copy($stateParams.abonent));

        $scope.model = {
            allowedFloors: $scope.abonent.floors.join(",")
        };
        $scope.$watch('model.allowedFloors', function(newVal) {
            if (newVal) {
                $scope.abonent.floors = newVal.split(',')
                  .map(function(item) { return parseInt(item.trim(), 10); })
                  .filter(function(num) { return !isNaN(num); });
            } else {
                $scope.abonent.floors = [];
            }
        });

        $scope.lowerFloorValidation = function() {
            var val = $scope.abonent.lowerFloor;
            if (val === '0') return;
            if (val === '-') return;
            if (val.length === 2) {
                if (val[0] === "0") {
                    $scope.abonent.lowerFloor = '0';
                    return;
                }
                if (Number(val) >= -5 && Number(val) <= 0) return;
                $scope.abonent.lowerFloor = '-';
                return;
            }
            if (val.length > 2) {
                $scope.abonent.lowerFloor = val.slice(0,2);
                return;
            }
            $scope.abonent.lowerFloor = '';
        };

        $scope.workingTimeStart = function () {
            var val = $scope.abonent.workingTime.start.replace(/[^0-9]/g, '');
            if (val.length === 2) {
                $scope.abonent.workingTime.start = val + ":";
                return;
            }
        }

        $scope.workingTimeEnd = function () {
            var val = $scope.abonent.workingTime.end.replace(/[^0-9]/g, '');
            if (val.length === 2) {
                $scope.abonent.workingTime.end = val + ":";
                return;
            }
        }

        $scope.onlyNumbersExternalId = function () {
            var val = $scope.abonent.externalId;
            $scope.abonent.externalId = val.replace(/[^0-9]/g, '');
        }

        $scope.onlyNumbersFloor = function () {
            var val = $scope.abonent.floor;
            $scope.abonent.floor = val.replace(/[^0-9]/g, '');
            if (val === "123456") {
                $scope.abonent.floor = 123456;
                return;
            }

            if (val > 200 && val !== 123456) $scope.abonent.floor = 200;
        }

        $scope.save = function() {
            $scope.abonent.$save(function(response) {
                notify(gettextCatalog.getString('abonents.abonent_updated'));
                $state.current.showConfirmation = false;
                User.updateKeyCountInfo();
                $state.go('admin.abonent.list');
            });
        };

        $scope.delete = function() {
            if (window.confirm(gettextCatalog.getString('abonents.abonent_delete_confirm'))) {
                $scope.abonent.$delete(function (response) {
                    notify(gettextCatalog.getString('abonents.abonent_deleted'));
                    $state.current.showConfirmation = false;
                    $state.go('admin.abonent.list');
                });
            }
        };

        $scope.deletePerimeterKey = function(object) {
            if (window.confirm(gettextCatalog.getString('abonents.key_delete_confirm'))) {
                var index = $scope.abonent.perimeters.indexOf(object);
                $scope.abonent.perimeters.splice(index, 1);
                $scope.abonent.$save(function (response) {
                    notify(gettextCatalog.getString('abonents.key_deleted'));
                    $state.current.showConfirmation = false;
                    User.updateKeyCountInfo();
                });
            }
        };

        $scope.deleteTemporaryPerimeterKey = function (object) {
            if (window.confirm(gettextCatalog.getString('abonents.key_delete_confirm'))) {
                var index = $scope.abonent.temporaryAccessPerimeters.indexOf(object);
                $scope.abonent.temporaryAccessPerimeters.splice(index, 1);
                $scope.abonent.$save(function (response) {
                    notify(gettextCatalog.getString('abonents.key_deleted'));
                    $state.current.showConfirmation = false;
                    User.updateKeyCountInfo();
                });
            }
        };

        $scope.cameras = [];
        $scope.abonentCameras = [];
        $scope.selectedCamera = {};

        $scope.loadCameras = function(reset) {
            Camera.query(angular.extend({skip: 0, take: 99999})).$promise.then(function(response) {
                $scope.cameras = response;
            });
        };
        $scope.loadAbonentCameras = function() {
            var params = {
                AbonentId: $scope.abonent.id,
                Action: 'GetAbonentCameras',
            };

            $http.get(settings.API_URL + '?' + $httpParamSerializer(params)).then(function(response) {
                $scope.abonentCameras = response.data;
                $scope.cameras = $scope.cameras.filter(c => !$scope.abonentCameras.find(ac => ac.id === c.id));
            });
        };

        $scope.loadCameras();
        $scope.loadAbonentCameras();

        $scope.addCamera = function() {
            if (!$scope.selectedCamera.id) return;
            if ($scope.abonentCameras.find(c => c.id === $scope.selectedCamera.id)) return;

            var request = {
                AbonentId: $scope.abonent.id,
                CameraId: $scope.selectedCamera.id,
                Action: 'AddCameraAccessPoint',
            };

            $http.post(settings.API_URL, request).then(function(response) {
                notify(gettextCatalog.getString('camera.camera_created'));
                $scope.loadAbonentCameras();
            });
        }

        $scope.deleteCamera = function(id) {

            var request = {
                CameraAccessPointId: id,
                Action: 'DeleteCameraAccessPoint',
            };

            $http.post(settings.API_URL, request).then(function(response) {
                notify(gettextCatalog.getString('camera.camera_deleted'));
                $scope.loadAbonentCameras();
            });
        }

        $controller('ObjectWatchChangesCtrl', {
            $scope: $scope,
            $state: $state,
            object: $scope.abonent
        });
    }
]);
