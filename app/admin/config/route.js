
app.config(['$stateProvider', 'settings', function($stateProvider, settings) {

    $stateProvider
        .state('admin', {
            url: '/',
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'admin.html',
            redirectTo: 'admin.client.list',
            data: {
                permissions: {
                    except: ['anonymous'],
                    redirectTo: 'login'
                }
            }
        })
        .state('admin.home', {
            url: '',
            controller: ['$state', function ($state) {
                $state.go('admin.client.list');
            }]
        })

        .state('admin.client', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'client/base.html'
        })
        .state('admin.client.list', {
            url: "client",
            controller: 'ClientListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'client/list.html'
        })
        .state('admin.client.detail', {
            url: "client/:id",
            controller: 'ClientDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'client/detail.html'
        })

        .state('admin.lock', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'lock/base.html'
        })
        .state('admin.lock.list', {
            url: "lock",
            controller: 'LockListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'lock/list.html'
        })
        .state('admin.lock.create', {
            url: "lock/create",
            controller: 'LockCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'lock/create.html'
        })
        .state('admin.lock.detail', {
            url: "lock/:id",
            controller: 'LockDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'lock/detail.html'
        })
        .state('admin.lock.replace', {
            url: "lock/:id/replace",
            controller: 'LockReplaceCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'lock/replace.html'
        })

        .state('admin.company', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'company/base.html'
        })
        .state('admin.company.list', {
            url: "company",
            controller: 'CompanyListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'company/list.html'
        })
        .state('admin.company.create', {
            url: "company/create",
            controller: 'CompanyCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'company/create.html'
        })
        .state('admin.company.detail', {
            url: "company/:id",
            controller: 'CompanyDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'company/detail.html',
            params: {
                company: null
            }
        })

        .state('admin.accessPoint', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'access_point/base.html'
        })
        .state('admin.accessPoint.list', {
            url: "access_point/",
            controller: 'AccessPointListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'access_point/list.html'
        })

        .state('admin.payments', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'payments/base.html'
        })
        .state('admin.payments.list', {
            url: "payments",
            controller: 'PaymentsListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'payments/list.html'
        })

        .state('admin.localKeys', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'local_keys/base.html'
        })
        .state('admin.localKeys.list', {
            url: "local-keys",
            controller: 'LocalKeysListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'local_keys/list.html'
        })

        .state('admin.postamates', {
            abstract: true,
            templateUrl: settings.TEMPLATE_DIR + 'local_keys/base.html'
        })
        .state('admin.postamates.list', {
            url: "postamates",
            controller: 'PostamatesListCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'postamates/list.html'
        })
        .state('admin.postamates.create', {
            url: "postamates/create",
            controller: 'PostamatCreateCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'postamates/create.html'
        })
        .state('admin.postamates.detail', {
            url: "postamates/:id",
            controller: 'PostamatDetailCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'postamates/detail.html',
            params: {
                postamat: null
            }
        })

      .state('admin.cameras', {
          abstract: true,
          templateUrl: settings.TEMPLATE_DIR + 'cameras/base.html'
      })
      .state('admin.cameras.list', {
          url: "cameras",
          controller: 'CamerasListCtrl',
          templateUrl: settings.TEMPLATE_DIR + 'cameras/list.html'
      })

        .state('login', {
            url: "/login",
            controller: 'LoginCtrl',
            templateUrl: settings.TEMPLATE_DIR + 'login.html',
            data: {
                permissions: {
                    only: ['anonymous'],
                    redirectTo: 'admin.client.list'
                }
            }
        })
        .state('admin.404', {
            url: "*path",
            templateUrl: settings.TEMPLATE_DIR + '404.html'
        });
}]);
