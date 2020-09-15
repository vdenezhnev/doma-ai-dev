
app.factory('AccessObject', ['$resource', 'settings', 'AccessPerimeter', 'AccessPoint',
    function($resource, settings, AccessPerimeter, AccessPoint) {
        var AccessObject = $resource(settings.API_URL, {}, {
            save: {
                method: 'POST',
                transformRequest: function(data, headers){
                    data['Action'] = data.id ? 'EditAccessObject' : 'CreateAccessObject';
                    if (data.id) {
                        data['id'] = data.id;
                    }
                    return angular.toJson(data);
                }
            },
            query: {
                url: settings.API_URL + '?action=GetAccessObjects',
                isArray: false,
                transformResponse: function (data, headers) {
                    var wrapped = JSON.parse(data);
                    angular.forEach(wrapped.items, function(item, idx) {
                        wrapped.items[idx] = new AccessObject(item);
                    });
                    return wrapped;
                }
            }
        });

        AccessObject.prototype.accessPerimeters = undefined;
        AccessObject.prototype._loadedAccessPerimeters = false;

        AccessObject.prototype.getAccessPerimeters = function () {
            if (this._loadedAccessPerimeters == false) {
                this._loadedAccessPerimeters = true;
                var self = this;

                AccessPerimeter.query({AccessObjectId: this.id}, function (response) {
                    var tree = {};
                    var ltt = new LTT(response.items, {
                        key_id: 'id',
                        key_parent: 'parentId'
                    });

                    self.accessPerimeters = ltt.GetTree();
                })
            }

            return this.accessPerimeters;
        };
        
        
        AccessObject.getCompleteTree = function () {
            var self = this;
            var result = [];
            var objectsCount = 0;

            this.query(function (response) {
                objectsCount = response.items.length;
                angular.forEach(response.items, function (accessObject, idx) {
                    accessObject['parentId'] = '0';
                    result.push(accessObject);

                    AccessPerimeter.query({AccessObjectId: accessObject.id}, function (response) {
                        angular.forEach(response.items, function (item, idx) {
                            if (item.parentId == '00000000-0000-0000-0000-000000000000') {
                                item.parentId = accessObject.id;
                            }
                            result.push(item);
                        });

                        objectsCount -= 1;
                        if (objectsCount == 0) {
                            var ltt = new LTT(result, {
                                key_id: 'id',
                                key_parent: 'parentId'
                            });

                            return ltt.GetTree();
                        }
                    });
                });
            });
        };
        
        return AccessObject;
    }
]);
