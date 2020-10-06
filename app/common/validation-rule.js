(function() {
  angular
    .module('smartkey.validation-rule', ['gettext', 'validation'])
    .config(['$validationProvider', function($validationProvider) {

      $validationProvider.setExpression({
        password: /^(?=.*).{6,}$/,
        phone: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\.\/0-9]*$/,
        username: /^(.+){3,}$/,
        email: /^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,5}|[0-9]{1,3})(\]?)$/,
        password_match: function(value, scope, element, attrs) {
          return value == scope.$eval(attrs.validatorMatch);
        },
        positive_number: function(value, scope, element, attrs, param) {
          var pattern = /^\d+$/;
          return pattern.test(value) && parseInt(value) > 0;
        },
        nil_and_more: function(value, scope, element, attrs, param) {
          var pattern = /^\d+$/;
          return pattern.test(value) && parseInt(value) >= 0;
        },
        minvalue: function(value, scope, element, attrs, param) {
          return parseInt(value) >= parseInt(param);
        },
        maxvalue: function(value, scope, element, attrs, param) {
          return parseInt(value) <= parseInt(param);
        }
      });

    }]).run(['$injector', 'gettextCatalog', function($injector, gettextCatalog){
      var $validationProvider = $injector.get('$validation');
      gettextCatalog.setCurrentLanguage(window.__language);

      $validationProvider.setDefaultMsg({
        required: {
            error: gettextCatalog.getString('validation.required')
        },
        email: {
            error: gettextCatalog.getString('validation.email')
        },
        number: {
            error: gettextCatalog.getString('validation.number')
        },
        password: {
            error: gettextCatalog.getString('validation.password')
        },
        password_match: {
            error: gettextCatalog.getString('validation.password_match')
        },
        phone: {
            error: gettextCatalog.getString('validation.phone')
        },
        username: {
            error: gettextCatalog.getString('validation.username')
        },
        minvalue: {
            error: gettextCatalog.getString('validation.min_number')
        },
        maxvalue: {
            error: gettextCatalog.getString('validation.max_number')
        },
        positive_number: {
            error: gettextCatalog.getString('validation.positive_number')
        },
        nil_and_more: {
          error: gettextCatalog.getString('validation.nil_and_more')
        }
      })
    }]);
}).call(this);
