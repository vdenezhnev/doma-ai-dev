var flatten = function(ob) {
    var toReturn = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) === 'object') {
            var flatObject = flatten(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;
                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
};

function difference(object, base) {
	function changes(object, base) {
		return _.transform(object, function(result, value, key) {
			if (!_.isEqual(value, base[key])) {
				result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
}

var hasDiff = function (obj1, obj2) {
    obj1 = angular.fromJson(obj1);
    obj2 = angular.fromJson(angular.toJson(obj2));

    var flatten1 = flatten(obj1);
    var flatten2 = flatten(obj2);

    var prepared1 = _.pickBy(flatten1, function (value) {
        return value !== undefined && value !== '' && value !== [] && value !== {};
    });
    var prepared2 = _.pickBy(flatten2, function (value) {
        return value !== undefined && value !== '' && value !== [] && value !== {};
    });

    return difference(prepared1, prepared2);
};
