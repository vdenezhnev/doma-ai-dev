'use strict';

app.controller('PaymentsListCtrl', ['$scope', 'Api', 'settings', 'ModalService',
    function($scope, Api, settings, ModalService) {
        $scope.checkedAll = false;
        $scope.payments = [];
        $scope.skip = 0;
        $scope.loadedAllPayments = false;
        $scope.listFilter = {
            payment: {
                from: null,
                to: null
            }
        };

        $scope.loadPayments = function(take, reset, filter) {
            var action = ($scope.q || filter) ? 'SearchAccessPointsForSimCardPayment' : 'GetLatestRegisteredAccessPointsForSimCardPayment';
            var request = {
                'Action': action,
                'Skip': $scope.skip,
                'Take': take,
                'SearchPhrase': $scope.q
            };

            if (filter) {
                request.paymentTo = filter.payment.from;
                request.paymentFrom = filter.payment.to;
            }

            Api.get(settings.API_URL, request, function(response) {
                $scope.skip += response.data.length;

                if (reset) {
                    $scope.payments = response.data;
                }
                else {
                    $scope.payments.push.apply($scope.payments, response.data);
                }

                $scope.loadedAllPayments = response.data.length < take;
            });

        };

        $scope.changePaymentDate = function () {
            ModalService.showModal({
                templateUrl: `${settings.TEMPLATE_DIR}payments/changePaymentDate.html`,
                controller: 'ChangePaymentDateCtrl',
            }).then(function(modal) {
                modal.element.modal();
                return modal.closed;
            }).then(function (value) {
                $scope.setNewPaymentDate(value);
            });
        };

        $scope.setNewPaymentDate = function(newDate) {
            // TODO
        };

        $scope.setAllSelected = function() {
           angular.forEach($scope.payments, function (value) {
               value.checked = $scope.checkedAll ? true : false;
           });
        }

        $scope.onCheck = function (payment) {
            // TODO
        };

        $scope.$watch('q', function(newVal, oldVal){
            if (newVal != oldVal) {
                $scope.skip = 0;
                $scope.loadPayments(20, true, $scope.listFilter);
            }
        });

        $scope.$watch('listFilter', function(newVal, oldVal){
            if (!angular.equals(newVal, oldVal)) {
                $scope.skip = 0;
                $scope.loadPayments(20, true, newVal);
            }
        }, true);

        $scope.loadPayments(20, false);

    }
]);

app.controller('ChangePaymentDateCtrl', ['$scope', 'close', '$element',
    function($scope, close, $element) {
        $scope.calendarOptions = {
            startView: 'day',
            minView: 'day'
        };
        $scope.newDate = new Date();

        $scope.closeModal = function() {
            $element.modal('hide');
            close($scope.newDate, 500);
        };
    }
]);