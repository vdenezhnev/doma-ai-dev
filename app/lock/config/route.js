
app.config(['$stateProvider', 'settings', function($stateProvider, settings) {

$stateProvider
  .state('lock', {
    url: '/',
    abstract: true,
    templateUrl: settings.TEMPLATE_DIR + 'lock.html',
    redirectTo: 'lock.open'
  })
  .state('lock.home', {
    url: '',
    controller: ['$state', function ($state) {
      $state.go('lock.open');
    }]
  })

  .state('lock.open', {
    url: "open?locks&uuid&online_server&qrcode&pincode",
    controller: 'LockCtrl',
    templateUrl: settings.TEMPLATE_DIR + 'lock/open.html'
  })

  .state('lock.openQr', {
    url: "openQr?qrcode",
    controller: 'LockQrCtrl',
    templateUrl: settings.TEMPLATE_DIR + 'lock/openQr.html'
  })

  .state('lock.404', {
    url: "*path",
    templateUrl: settings.TEMPLATE_DIR + '404.html'
  });
}]);
