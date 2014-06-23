'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('localizationService', ['$window', '$translate', '$q', 'tmhDynamicLocale', function($window, $translate, $q, tmhDynamicLocale) {

        var localizationService = {};

        var templatePrefix = "[{";
        var templateSuffix = "}]";

        localizationService.supportedLanguages = [
            'en',
            'fr'
        ];
        localizationService.defaultLanguage = localizationService.supportedLanguages[0];
        localizationService.browserLanguage = $window.navigator.userLanguage || $window.navigator.language;
        localizationService.language = null;

        localizationService.setLanguage = function(language) {
            localizationService.language = localizationService.defaultLanguage;
            if (isSupportedLanguage(language)) {
                localizationService.language = language;
            } else {
                if (isSupportedLanguage(localizationService.browserLanguage)) {
                    localizationService.language = localizationService.browserLanguage;
                }
            }
            $translate.use(localizationService.language);            
            return tmhDynamicLocale.set(localizationService.language);                
        };

        localizationService.get = function(key) {           
            return $translate.instant(key);
        };
       
        localizationService.applyLocalizedTemplate = function(templatedString, values) {
            var translatedValues = {};
            angular.forEach(values, function(value, key) {
                translatedValues[key] = localizationService.get(value, true);
            });
            return localizationService.applyTemplate(templatedString, translatedValues);
        };


        localizationService.applyTemplate = function(templatedString, values) {
            var searchIndex = 0;
            var offset = templatePrefix.length;
            var resultStr = templatedString;            
            while (resultStr.indexOf(templatePrefix, searchIndex) !== -1) {
                var key = resultStr.substring(resultStr.indexOf(templatePrefix, searchIndex) + offset, resultStr.indexOf(templateSuffix, searchIndex));
                var stringToReplace = templatePrefix + key + templateSuffix;
                var replacement = values[key];
                resultStr = resultStr.replace(stringToReplace, replacement);
                searchIndex = resultStr.indexOf(templatePrefix, searchIndex);
            }
            return resultStr;
        };


        function isSupportedLanguage(language) {
            var supported = false;
            if (language) {
                angular.forEach(localizationService.supportedLanguages, function(supportedLanguage) {
                    if (language.indexOf(supportedLanguage) !== -1) {
                        supported = true;
                        return;
                    }
                });
            }
            return supported;
        }




        return localizationService;
    }]);

