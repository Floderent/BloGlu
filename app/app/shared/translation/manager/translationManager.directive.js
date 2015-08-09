(function(){
    'use strict';
    
    angular.module('bloglu.translation')
            .directive('blogluTranslationManager', translationManager);    
    
    function translationManager(){
        return {
            restrict: 'AE',
            replace: true,
            templateUrl: 'app/shared/translation/manager/translationManager.html',
            controller: 'translationManagerController as vm',
            scope:{}
        };
    }

})();