
app.config(['$stateProvider', 'settings', function($stateProvider, settings) {

$stateProvider
  .state('courier', {
    url: '/',
    abstract: true,
    templateUrl: settings.TEMPLATE_DIR + 'courier.html',
    redirectTo: 'courier.panel.actions'
  })
  .state('courier.home', {
    url: '',
    controller: ['$state', function ($state) {
      $state.go('courier.panel.actions');
    }]
  })

  .state('courier.panel', {
    abstract: true,
    templateUrl: settings.TEMPLATE_DIR + 'panel/base.html'
  })
  .state('courier.panel.actions', {
    url: "panel/:code",
    controller: 'CourierPanelCtrl',
    templateUrl: settings.TEMPLATE_DIR + 'panel/actions.html'
  })

  .state('courier.404', {
    url: "*path",
    templateUrl: settings.TEMPLATE_DIR + '404.html'
  });
}]);
