app.directive('translate', ['LOCALE_RU', 'LOCALE_EN', 'LOCALE_AR', '$localStorage', 'defaultLocale',
    function(LOCALE_RU, LOCALE_EN, LOCALE_AR, $localStorage, defaultLocale){
        return {
            restrict: 'A',
            link: function(scope, el, attrs){
                const elementKey = el.text().trim();
                let selectedLocale = $localStorage.user_locale;
                let localeDict = null;

                if (!elementKey) {
                    return;
                }

                if (!selectedLocale) {
                    selectedLocale = defaultLocale.key;
                }

                switch (selectedLocale) {
                    case 'RU':
                        localeDict = LOCALE_RU;
                        break;
                    case 'EN':
                        localeDict = LOCALE_EN;
                        break;
                    case 'AR':
                        localeDict = LOCALE_AR;
                        break;
                    default:
                        localeDict = LOCALE_EN;
                        break;
                };

                angular.forEach(localeDict, function (value, key) {
                    if (key === elementKey) {
                        el.text(value);
                    }
                });
            }
        };
    }
]);

app.filter('translate', ['LOCALE_RU', 'LOCALE_EN', 'LOCALE_AR', '$localStorage', 'defaultLocale',
    function (LOCALE_RU, LOCALE_EN, LOCALE_AR, $localStorage, defaultLocale) {
        return function (value) {
            const elementKey = value.trim();
            let selectedLocale = $localStorage.user_locale;
            let localeDict = null;
            let resultValue = null;

            if (!elementKey) {
                return;
            }

            if (!selectedLocale) {
                selectedLocale = defaultLocale.key;
            }

            switch (selectedLocale) {
                case 'RU':
                    localeDict = LOCALE_RU;
                    break;
                case 'EN':
                    localeDict = LOCALE_EN;
                    break;
                case 'AR':
                    localeDict = LOCALE_AR;
                    break;
                default:
                    localeDict = LOCALE_EN;
                    break;
            };

            angular.forEach(localeDict, function (value, key) {
                if (key === elementKey) {
                    resultValue = value;
                }
            });

            return resultValue;
        };
    }
]);