
app.service('DataService', ['$rootScope', '$q', '$http', 'Tariff', 'Address', 'AccessObject', 'AccessPerimeter', 'AccessPoint',
    function($rootScope, $q, $http, Tariff, Address, AccessObject, AccessPerimeter, AccessPoint) {

        this.tariffs = {};
        this.addresses = {};
        this.objects = {};
        this.accessObjects = {};
        this.accessPoints = {};
        var self = this;

        function loadData(factory) {
            var deferred = $q.defer();

            factory.query(function(response) {
                var values = response;
                if (response.items) {
                    var values = response.items;
                }

                var items = {};
                angular.forEach(values, function (item) {
                    items[item.id] = new factory(item);
                });
                deferred.resolve(items);
            });

            return deferred.promise;
        }
        
        function loadAccessObjects() {
            var deferred = $q.defer();
            var objectsCount = 0;

            AccessObject.query(function (response) {
                var result = [];
                objectsCount = response.items.length;
                
                angular.forEach(response.items, function (accessObject, idx) {
                    accessObject['parentId'] = '0';
                    result.push(new AccessObject(accessObject));
                    self.accessObjects[accessObject.id] = new AccessObject(accessObject);

                    AccessPerimeter.query({AccessObjectId: accessObject.id}, function (response) {
                        angular.forEach(response.items, function (item, idx) {
                            if (item.parentId == '00000000-0000-0000-0000-000000000000') {
                                item.parentId = accessObject.id;
                            }
                            result.push(new AccessPerimeter(item));
                        });

                        objectsCount -= 1;
                        if (objectsCount == 0) {
                            var ltt = new LTT(result, {
                                key_id: 'id',
                                key_parent: 'parentId'
                            });
                            
                            deferred.resolve(ltt);
                        }
                    });
                });
            });
            
            return deferred.promise;
        }

        $rootScope.$on('updateTariffs', function (event, data) {
            loadData(Tariff).then(function(tariffs) {
                self.tariffs = tariffs;
            });
        });

        $rootScope.$on('updateAddresses', function (event, data) {
            loadData(Address).then(function(addresses) {
                self.addresses = addresses;
            });
        });

        $rootScope.$on('updateObjects', function (event, data) {
            loadAccessObjects().then(function(accessObjects) {
                self.objects = accessObjects;
            });
        });

        this.getParentsAccessObjects = function(object, addCurrent) {
            var result = [];
            if (object != undefined) {
                if (typeof object == 'string') {
                    object = self.objects.GetItemById(object);
                }

                if (addCurrent == true) {
                    result.push(object);
                }
                while (true) {
                    if (self.objects.list) {
                        var el = _.find(self.objects.list, {id: object.parentId});
                        if (el != undefined) {
                            result.push(el);
                            object = el;
                        }
                        else {
                            break;
                        }
                    }
                }
            }

            return result.reverse();
        };
        
        this.load = function () {
            loadData(Tariff).then(function(tariffs) {
                self.tariffs = tariffs;
            });
    
            loadData(Address).then(function(addresses) {
                self.addresses = addresses;
            });
    
            loadAccessObjects().then(function(accessObjects) {
                self.objects = accessObjects;
            });

            loadData(AccessPoint).then(function(accessPoints) {
                self.accessPoints = accessPoints;
            });
        }
    }
]);
