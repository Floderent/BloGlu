(function () {
    'use strict';

    angular.module('bloglu.translation')
            .config(translationConfig)
            .config(tmhDynamicLocaleConfig)
            .constant('LOCALES', {
                'locales': [
                    {langKey: 'fr', langText: 'Français', flagKey: 'fr'},
                    {langKey: 'en', langText: 'English', flagKey: 'gb'}
                ],
                'preferredLocale': 'fr'
            });

    translationConfig.$inject = ['$translateProvider'];

    function translationConfig($translateProvider) {
        //FIXME only for debug
        $translateProvider.useMissingTranslationHandlerLog();

        $translateProvider.useStaticFilesLoader({
            prefix: 'assets/i18n/locale-',
            suffix: '.json'
        });
        $translateProvider.useSanitizeValueStrategy('escape');
        $translateProvider.preferredLanguage('fr');
        $translateProvider.fallbackLanguage('fr');
        $translateProvider.useLocalStorage();
    }



    tmhDynamicLocaleConfig.$inject = ['tmhDynamicLocaleProvider'];

    function tmhDynamicLocaleConfig(tmhDynamicLocaleProvider) {
        tmhDynamicLocaleProvider.localeLocationPattern('assets/i18n/angular-locale_{{locale}}.js');
    }



})();
