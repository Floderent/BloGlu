(function(){
    'use strict';
    
    angular.module('bloglu.translation')
            .controller('translationManagerController', TranslationManagerController);
    
    TranslationManagerController.$inject = ['translationService'];
    
    function TranslationManagerController(translationService){
        var vm = this;
        
        vm.changeLanguage = translationService.changeLanguage;                
        vm.getCurrentLocale = translationService.getCurrentLocale;
        vm.locales = translationService.locales;
    }    
    
})();
