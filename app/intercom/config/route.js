'use strict';

app.config(['$stateProvider', 'settings', function($stateProvider, settings) {
    $stateProvider

        .state('auth', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'auth/base.html',
            data: {
                permissions: {
                    only: ['anonymous'],
                    redirectTo: 'admin'
                }
            }
        })
        .state('auth.login', {
            url: "/auth/login",
            controller: 'LoginCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'auth/login.html'
        })
        .state('auth.restore_password', {
            url: "/auth/restore_password",
            controller: 'RestorePasswordCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'auth/restore_password.html'
        })
        .state('auth.confirm_password_reset', {
            url: settings.AUTH_PASSWORD_CHANGE_URL,
            controller: 'ConfirmPasswordResetCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'auth/confirm_password_reset.html',
            params: {
                code: null
            }
        })
        .state('auth.confirm_password_reset_web', {
            url: '/auth/confirm_password_reset_web?code',
            controller: 'ConfirmPasswordResetWebCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'auth/confirm_password_reset_web.html',
            params: {
                code: null
            }
        })

        .state('auth.email_confirm', {
            url: '/email_confirm?code',
            controller: 'ConfirmEmailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'auth/email_confirmation.html',
            params: {
                code: null
            }
        })
        .state('auth.mobile_password_reset', {
            url: '/reset_password?code',
            controller: 'MobilePasswordResetWebCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'auth/mobile_reset_password.html',
            params: {
                code: null
            }
        })
        .state('auth.activate_account', {
            url: settings.AUTH_ACTIVATION_ACCOUNT_URL,
            controller: 'ActivateAccountCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'auth/activate_account.html',
            params: {
                code: null
            }
        })

        .state('admin', {
            url: '/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'base.html',
            data: {
                permissions: {
                    except: ['anonymous'],
                    redirectTo: 'auth.login'
                }
            }
        })

        .state('admin.home', {
            url: '',
            controller: ['$state', function ($state) {
                $state.go('admin.abonent.list');
            }]
        })
        
        .state('admin.account', {
            url: 'account/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'account/base.html'
        })
        .state('admin.account.profile', {
            url: 'profile',
            controller: 'AccountProfileCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'account/profile.html'
        })
        .state('admin.account.change_password', {
            url: 'change_password',
            controller: 'AccountChangePasswordCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'account/change_password.html'
        })

        .state('admin.tariff', {
            url: 'tariff/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'tariff/base.html'
        })
        .state('admin.tariff.list', {
            url: 'list',
            controller: 'TariffListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'tariff/list.html'
        })
        .state('admin.tariff.create', {
            url: 'create',
            controller: 'TariffCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'tariff/create.html'
        })
        .state('admin.tariff.detail', {
            url: 'detail/:id/:revision',
            controller: 'TariffDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'tariff/detail.html',
            resolve: {
                tariff: function(Tariff, $stateParams) {
                    return Tariff.get({id: $stateParams.id, Revision: $stateParams.revision}).$promise;
                }
            }
        })

        .state('admin.address', {
            url: 'address/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'address/base.html'
        })
        .state('admin.address.list', {
            url: 'list',
            controller: 'AddressListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'address/list.html'
        })
        .state('admin.address.create', {
            url: 'create',
            controller: 'AddressCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'address/create.html'
        })
        .state('admin.address.detail', {
            url: 'detail/:id',
            controller: 'AddressDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'address/detail.html',
            params: {
                address: null
            }
        })
        
        .state('admin.abonent', {
            url: 'abonent/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'abonent/base.html'
        })
        .state('admin.abonent.list', {
            url: 'list',
            controller: 'AbonentListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'abonent/list.html'
        })
        .state('admin.abonent.create', {
            url: 'create',
            controller: 'AbonentCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'abonent/create.html'
        })
        .state('admin.abonent.detail', {
            url: 'detail/:id',
            controller: 'AbonentDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'abonent/detail.html',
            params: {
                abonent: null
            }
        })

        .state('admin.roles', {
            url: 'roles/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'roles/base.html'
        })
        .state('admin.roles.list', {
            url: 'list',
            controller: 'RolesListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'roles/list.html'
        })
        .state('admin.roles.create', {
            url: 'create',
            controller: 'RoleCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'roles/create.html'
        })
        .state('admin.roles.detail', {
            url: 'detail/:id',
            controller: 'RoleDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'roles/edit.html',
            params: {
                role: null
            }
        })

        .state('admin.payments', {
            url: 'payments',
            controller: 'PaymentsCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'payments/list.html'
        })
        
        .state('admin.journal', {
            url: 'journal/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'payment/base.html'
        })
        .state('admin.journal.list', {
            url: 'list',
            controller: 'JournalListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'journal/list.html'
        })

        .state('admin.device', {
            url: 'device/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'device/base.html'
        })
        .state('admin.device.list', {
            url: 'list',
            controller: 'DeviceListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'device/list.html'
        })
        .state('admin.device.create', {
            url: 'create',
            controller: 'DeviceCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'device/create.html'
        })
        .state('admin.device.detail', {
            url: 'detail/:id',
            controller: 'DeviceDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'device/detail.html',
            params: {
                device: null
            }
        })
        
        .state('admin.access', {
            url: 'access/',
            controller: 'AccessCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access/base.html'
        })
        .state('admin.access.add_object', {
            url: 'add_object/',
            controller: 'AddAccessObjectCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access/object/add.html'
        })
        .state('admin.access.edit_object', {
            url: 'edit_object/',
            controller: 'EditAccessObjectCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access/object/edit.html',
            params: {
                object: null
            }
        })
        .state('admin.access.add_perimeter', {
            url: 'add_perimeter/',
            controller: 'AddAccessPerimeterCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access/perimeter/add.html',
            params: {
                accessObject: null,
                parentPerimeter: null
            }
        })
        .state('admin.access.edit_perimeter', {
            url: 'edit_perimeter/',
            controller: 'EditAccessPerimeterCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access/perimeter/edit.html',
            params: {
                object: null,
                accessObject: null
            }
        })
        .state('admin.access.add_point', {
            url: 'add_point/',
            controller: 'AddAccessPointCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access/point/add.html',
            params: {
                parentPerimeter: null
            }
        })
        .state('admin.access.edit_point', {
            url: 'edit_point/:id/',
            controller: 'EditAccessPointCtrl',
            controllerAs: 'vm',
            templateUrl: settings.TEMPLATE_DIR + 'access/point/edit.html',
            params: {
                accessPoint: null
            },
            resolve: {
                point: function(AccessPoint, PostamatAccessPoint, $stateParams) {
                    return $stateParams.accessPoint.isPostamatAccessPoint ?
                        PostamatAccessPoint.get({Id: $stateParams.id}).$promise :
                        AccessPoint.get({AccessPointId: $stateParams.id}).$promise;
                }
            }
        })

        .state('admin.control_panel_user', {
            url: 'control_panel_user/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'control_panel_user/base.html'
        })
        .state('admin.control_panel_user.list', {
            url: 'list/',
            controller: 'ControlPanelUserListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'control_panel_user/list.html'
        })
        .state('admin.control_panel_user.create', {
            url: 'create/',
            controller: 'ControlPanelUserCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'control_panel_user/create.html'
        })
        .state('admin.control_panel_user.detail', {
            url: 'detail/:id/',
            controller: 'ControlPanelUserDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'control_panel_user/detail.html',
            params: {
                user: null
            }
        })

        .state('admin.access_right', {
            url: 'access_right/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'access_right/base.html'
        })
        .state('admin.access_right.list', {
            url: 'list',
            controller: 'AccessRightListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access_right/list.html'
        })

        .state('admin.404', {
            url: "*path",
            templateUrl: settings.TEMPLATE_DIR + '404.html'
        });
}]);
