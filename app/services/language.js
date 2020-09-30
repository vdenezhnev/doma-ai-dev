'use strict';

app.service('Language', ['$location', function($location) {
    var self = this;
    
    this.languages = {
        ru: 'Ру',
        en: 'En'
    };

    this.codes = {
        ru: 'ru',
        en: 'en'
    };
    
    this.active = window.__language;
    
    this.getTitle = function () {
        return self.languages[self.active];
    };

    this.getCode = function () {
        return self.codes[self.active];
    };
    
    this.setLanguage = function(code) {
        var uri = URI(window.location);
        var regex = new RegExp('^\/(intercom-' + self.active + ')\/');
        window.location = uri.path().replace(regex, '/intercom-' + code + '/');
    };
}]);
