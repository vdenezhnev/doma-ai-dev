app.directive('translate', ['LOCALE_RU', 'LOCALE_EN', 'LOCALE_AR',
  function(LOCALE_RU, LOCALE_EN, LOCALE_AR){
    return {
      restrict: 'A',
      link: function(scope, el, attrs) {
        const elementKey = el.text().trim();
        let selectedLocale = window.navigator.language;
        let localeDict = null;

        if (!elementKey) {
          return;
        }

        if (!selectedLocale) {
          selectedLocale = 'en-GB';
        }

        switch (selectedLocale) {
          case 'ru-RU':
          case 'ru':
            localeDict = LOCALE_RU;
            break;
          case 'en-GB':
          case 'en-US':
          case 'en':
            localeDict = LOCALE_EN;
            break;
          case 'ar-AR':
          case 'ar':
            localeDict = LOCALE_AR;
            break;
          default:
            localeDict = LOCALE_EN;
            break;
        }

        angular.forEach(localeDict, function (value, key) {
          if (key === elementKey) {
            el.text(value);
          }
        });
      }
    };
  }
]);

app.filter('translate', ['LOCALE_RU', 'LOCALE_EN', 'LOCALE_AR',
  function (LOCALE_RU, LOCALE_EN, LOCALE_AR) {
    return function(value) {
      const elementKey = value.trim();
      let selectedLocale = window.navigator.language;
      let localeDict = null;
      let resultValue = null;

      if (!elementKey) {
        return;
      }

      if (!selectedLocale) {
        selectedLocale = 'en-GB';
      }

      switch (selectedLocale) {
        case 'ru-RU':
        case 'ru':
          localeDict = LOCALE_RU;
          break;
        case 'en-GB':
        case 'en-US':
        case 'en':
          localeDict = LOCALE_EN;
          break;
        case 'ar-AR':
        case 'ar':
          localeDict = LOCALE_AR;
          break;
        default:
          localeDict = LOCALE_EN;
          break;
      }

      angular.forEach(localeDict, function (value, key) {
        if (key === elementKey) {
          resultValue = value;
        }
      });

      return resultValue;
    };
  }
]);