
app.controller('AppCtrl', ['$scope', '$state', function($scope, $state) {

}]);

app.controller('ObjectWatchChangesCtrl', ['$scope', '$state', 'object', function($scope, $state, object) {
    $scope.object = object;
    var originalObject = angular.copy($scope.object);
    $state.current.showConfirmation = false;

    $scope.resetObjectWatch = function () {
        originalObject = angular.copy($scope.object);
        $state.current.showConfirmation = false;
    };

    $scope.$watch('object | json', function (newVal) {
        var diff = hasDiff(newVal, originalObject);
        if (Object.keys(diff).length > 0) {
            $state.current.showConfirmation = true;
        }
        else {
            $state.current.showConfirmation = false;
        }
    });

}]);
