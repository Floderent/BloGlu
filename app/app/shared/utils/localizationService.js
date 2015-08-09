(function () {
'use strict';

angular.module('bloglu.utils')
        .factory('localizationService', localizationService);

localizationService.$inject = ['$window', '$translate', '$q', 'tmhDynamicLocale'];

function localizationService($window, $translate, $q, tmhDynamicLocale) {

        var localizationService = {};        

        localizationService.supportedLanguages = [
            'en',
            'fr'
        ];
        localizationService.defaultLanguage = localizationService.supportedLanguages[0];
        localizationService.browserLanguage = $window.navigator.userLanguage || $window.navigator.language;
        localizationService.language = null;

        localizationService.setLanguage = function(language) {            
            var deferred = $q.defer();
            localizationService.language = localizationService.defaultLanguage;            
            if (isSupportedLanguage(language)) {
                localizationService.language = language;
            } else {
                if (isSupportedLanguage(localizationService.browserLanguage)) {
                    localizationService.language = isSupportedLanguage(localizationService.browserLanguage);
                }
            }
            $translate.use(localizationService.language);
            deferred.resolve(tmhDynamicLocale.set(localizationService.language));            
            return deferred.promise;            
        };

        localizationService.get = function(key) {           
            return $translate.instant(key);
        };
       
        function isSupportedLanguage(language) {
            var supported = false;
            if (language) {
                angular.forEach(localizationService.supportedLanguages, function(supportedLanguage) {
                    if (language.indexOf(supportedLanguage) !== -1) {
                        supported = supportedLanguage;
                        return;
                    }
                });
            }
            return supported;
        }
        return localizationService;
    }
})();