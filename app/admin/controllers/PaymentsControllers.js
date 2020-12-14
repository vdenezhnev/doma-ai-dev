'use strict';

app.controller('PaymentsListCtrl', ['$scope', 'Api', 'settings', 'ModalService', 'notify', '$filter',
    function($scope, Api, settings, ModalService, notify, $filter) {
        $scope.checkedAll = false;
        $scope.isDisabledChangePaymentDate = true;
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
                request.paymentDateTo = filter.payment.to;
                request.paymentDateFrom = filter.payment.from;
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
            if (newDate && $scope.payments.length) {
                var checkedPayments = $scope.payments.filter(item => item.checked).map(item => item.id);
                Api.post(settings.API_URL, {
                    Action: 'UpdateAccessPointsForSimCardPayment',
                    AccessPointIds: checkedPayments,
                    PaymentDate: newDate
                }, function() {
                    notify($filter('translate')('NOTIFY_ENTRIES_UPDATED'));

                    $scope.payments.forEach(function (item) {
                        if (checkedPayments.includes(item.id)) {
                            item.paymentDate = newDate;
                        }
                    });
                }, function(error) {
                    notify(error);
                });
            }
        };

        $scope.setAllSelected = function() {
           angular.forEach($scope.payments, function (value) {
               value.checked = $scope.checkedAll ? true : false;
           });
           $scope.onCheck();
        }

        $scope.onCheck = function () {
            if ($scope.payments && $scope.payments.length) {
                var checkedPayments = $scope.payments.filter(item => item.checked).length;

                if (!Boolean(checkedPayments)) {
                    $scope.checkedAll = false;
                } else if (checkedPayments === $scope.payments.length) {
                    $scope.checkedAll = true;
                }

                $scope.isDisabledChangePaymentDate = !Boolean(checkedPayments);
            }
        };

        $scope.resetFilter = function () {
            $scope.listFilter.payment.to = null;
            $scope.listFilter.payment.from = null;
        }

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

        $scope.closeCancelModal = function() {
            $element.modal('hide');
            close(null, 500);
        };
    }
]);