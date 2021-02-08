
module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-angular-gettext');

    grunt.initConfig({
        nggettext_extract: {
            pot: {
                files: {
                    'app/translation/pot/site.pot': [
                        'app/cabinet/views/*.html',
                        'app/site/views/*.html',
                        'app/cabinet/cabinet.js',
                        'app/cabinet/controllers.js',
                        'app/site/.*js'
                    ],
                    'app/translation/pot/intercom.pot': [
                        'app/intercom/views/*.html',
                        'app/intercom/views/*/*.html',
                        'app/intercom/views/*/*/*.html',
                        'app/intercom/controllers/*.js',
                        'app/intercom/app.js'
                    ],
                    'app/translation/pot/validation.pot': [
                        'app/common/validation-rule.js'
                    ]
                }
            }
        },
        nggettext_compile: {
            all: {
              files: {
                'app/translation/i18n/site.js': [
                    'app/translation/po/site.ru.po',
                    'app/translation/po/site.en.po'
                ],
                'app/translation/i18n/intercom.js': [
                    'app/translation/po/intercom.ru.po',
                    'app/translation/po/intercom.en.po',
                    'app/translation/po/intercom.ar.po'
                ],
                'app/translation/i18n/validation.js': [
                    'app/translation/po/validation.ru.po',
                    'app/translation/po/validation.en.po',
                    'app/translation/po/validation.ar.po'
                ]
              }
            }
        }
    });
}