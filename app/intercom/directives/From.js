'use strict';

app.directive('selectAddress', ['DataService', function(DataService) {
    return {
        restrict: 'AE',
        link: function (scope, elem, attrs) {
            scope.addresses = DataService.addresses;

            scope.$watch(function () {
                return DataService.addresses;
            }, function (newVal) {
                scope.addresses = newVal;
            });
        },
        replace: true,
        scope: {
            ngSelectModel : '='
        },
        template: '<select ng-model="ngSelectModel" class="form-control" ng-options="address.id as address.value for address in addresses"><option></option></select>'
    };
}]);

app.directive('selectAbonent', ['Abonent', function(Abonent) {
    return {
        restrict: 'AE',
        link: function (scope, elem, attrs) {
            scope.abonents = Abonent.query();
        },
        replace: true,
        scope: {
            ngSelectModel : '='
        },
        template: '<select ng-model="ngSelectModel" class="form-control" ng-options="abonent.id as abonent.displayName for abonent in abonents"><option></option></select>'
    };
}]);

app.directive('selectTariff', ['DataService', function(DataService) {
    return {
        restrict: 'AE',
        link: function (scope, elem, attrs) {
            scope.tariffs = DataService.tariffs;
        },
        replace: true,
        scope: {
            ngSelectModel : '='
        },
        template: '<select ng-model="ngSelectModel" class="form-control" ng-options="tariff.id as tariff.displayName for tariff in tariffs"><option></option></select>'
    };
}]);

app.directive('selectAccessObject', ['DataService', function(DataService) {
    return {
        restrict: 'AE',
        link: function (scope, elem, attrs) {
            scope.accessObjects = DataService.accessObjects;
        },
        replace: true,
        scope: {
            ngSelectModel : '='
        },
        template: '<select ng-model="ngSelectModel" class="form-control" ng-options="accessObject.id as accessObject.displayName for accessObject in accessObjects"><option></option></select>'
    };
}]);

app.directive('selectAccessPoint', ['DataService', '$timeout', function(DataService, timeout) {
    return {
        restrict: 'AE',
        link: function (scope, elem, attrs, ngModel) {
            scope.items = [];
            scope.selected = {
                value: null
            };
            scope.isOpened = false;
            scope.search = '';

            scope.getLabel = function (accessPoint) {
                var label = '';
                DataService.getParentsAccessObjects(accessPoint.perimeterId, true).map(function (item) {
                   label += item.displayName + ' > ';
                });
                label += accessPoint.displayName;
                return label;
            };

            scope.$watch(function () {
                return DataService.accessPoints
            }, function (newVal) {
                DataService.accessObjectsAreLoaded
                    .then(() => {
                        var items = [];
                        if (!_.isEmpty(newVal)) {
                            console.log(newVal);
                            for (var key in newVal) {
                                items.push({
                                    id: newVal[key].id,
                                    name: scope.getLabel(newVal[key])
                                });
                            }
                        }
                        scope.items = items;
                    });
            });

            scope.$watchCollection('selected', function (newVal) {
                if (newVal) {
                    ngModel.$setViewValue(newVal.id);
                }
                else {
                    ngModel.$setViewValue(null);
                }
            });

            scope.reset = function () {
                scope.selected = {
                    value: null
                };
            }
            scope.selectItem = item => {
                scope.selected = item;
                scope.search = '';
                scope.isOpened = false;
            };
            scope.open = () => {
                scope.isOpened = true;
                timeout(() => {
                    const input = elem.find('input')[0];
                    input.focus();
                });
            };
            scope.close = () => {
                scope.isOpened = false;
            };
        },
        replace: true,
        require: 'ngModel',
        template: `
            <div class="control-wrapper">
                <div class="select-wrapper">
                    <span
                        ng-click="open()"
                        class="form-control"
                    >
                        {{isOpened ? '' : selected.name}}
                        <i class="select-toggle-icon fa fa-angle-down"/>
                    </span>

                    <div class="select-box" ng-if="isOpened">
                        <input
                            type="text"
                            ng-model="search"
                            ng-blur="close()"
                            class="form-control"
                            placeholder="Выберите точку доступа">
                        <div class="select-popup">
                            <div
                                class="select-option"
                                ng-repeat="item in items | filter:{name: search} track by item.id"
                                ng-mousedown="selectItem(item)">
                                {{item.name}}
                            </div>
                        </div>
                    </div>
                </div>
                <span class="btn btn-default btn-trash" ng-click="reset()"><i class="fa fa-trash"/></span>
            </div>
        `
    };
}]);

app.directive('accessObjects', ['DataService', function(DataService) {
    return {
        restrict: 'AE',
        link: function (scope, elem, attrs) {
            scope.objects = DataService.objects.GetTree();
            scope.navigate = {};

            scope.clickPerimeter = function (perimeter) {
                scope.perimeterModel = perimeter.id;
                if (scope.perimeterClick)
                    scope.perimeterClick({perimeter: perimeter, model: scope.perimeterModel})
            };
        },
        replace: true,
        scope: {
            ngSelectModel : '=',
            perimeterClick: '=',
            perimeterModel: '='
        },
        templateUrl: 'AccessObjectsTemplate'
    };
}]);

app.directive('selectDevice', ['$timeout', 'Device', function($timeout, Device) {
    return {
        restrict: 'AE',
        link: function(scope, elem, attrs) {
            var skip = 0;
            scope.devices = [];
            var devices = [];

            function cycle() {
                Device.query({skip: skip, take: 20}, function(response){
                    if (response.length > 0) {
                        skip += 20;
                        devices = devices.concat(response);
                        cycle();
                    }
                    else {
                        scope.devices = devices;
                        $timeout(function() {
                            angular.element(elem).multiSelect();
                        });
                    }
                });
            }

            cycle();

            scope.$watch(scope.ngBuildingFilter, function(newVal, oldVal){
                if (oldVal != newVal) {
                    $timeout(function() {
                        angular.element(elem).multiSelect('refresh');
                    });
                }
            });
        },
        replace: true,
        scope: {
            ngBuildingFilter: '&',
            ngSelectFilter: '='
        },
        template: '<select multiple class="form-control" ng-options="device.id as device.displayName for device in devices | filter:ngSelectFilter"></select>'
    };
}]);

app.directive('multiSelect', ['$timeout', function($timeout) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            $timeout(function() {
                angular.element(elem).multiSelect();
            });
        },
        replace: false
    };
}]);

app.directive('mask', function(){
    return {
        restrict: 'A',
        link: function(scope, el, attrs){
            var mask = scope.$eval(attrs.mask);
            $(el).inputmask(mask.mask);
        }
    };
});
