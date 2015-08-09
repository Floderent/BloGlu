(function () {
    'use strict';

    angular.module('bloglu.translation')
            .factory('translationService', translationService);

    translationService.$inject = ['$rootScope', '$translate', 'LOCALES', 'tmhDynamicLocale'];

    function translationService($rootScope, $translate, LOCALES, tmhDynamicLocale) {

        //by default set locale to preferred        
        if (!$translate.use()) {
            changeLanguage(LOCALES.preferredLocale);
        } else {
            tmhDynamicLocale.set(getCurrentLocale()).then(function () {
                $rootScope.$broadcast('langChanged', {langKey: getCurrentLocale()});
            });
        }


        var service = {
            getCurrentLocale: getCurrentLocale,
            changeLanguage: changeLanguage,
            translate: translate,
            locales: LOCALES.locales
        };
        return service;


        function changeLanguage(langKey) {
            $translate.use(langKey);
            return tmhDynamicLocale.set(langKey).then(function () {
                $rootScope.$broadcast('langChanged', {langKey: langKey});
                return;
            });
        }

        function translate(translationKey, args) {
            return $translate.instant(translationKey, args);
        }

        function getCurrentLocale() {
            return $translate.use();
        }

    }

})();