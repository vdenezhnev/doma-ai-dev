'use strict';

app.controller('PaymentCtrl', ['$scope', '$http', '$state', 'UserClient',
    function($scope, $http, $state, UserClient) {
        $scope.loader = UserClient.loadPayments(0, 100);
        $scope.data = {};

        $scope.payment = function() {
            $scope.loader = UserClient.paymentLink($scope.data.amount).then(function successCallback(response) {
                window.location = response.data.processPaymentUrl;
            }, function errorCallback(response) {
                $scope.response = response.data;
            });
        };
    }
]);
