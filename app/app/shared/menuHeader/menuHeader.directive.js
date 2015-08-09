(function () {
    'use strict';

    angular.module('bloglu.menuHeader')
            .directive('blogluMenuHeader', menuHeader);    
    
    function menuHeader(){
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'app/shared/menuHeader/menuHeader.html',
            controller: 'menuHeaderController as vm',
            scope:{}
        };
    }    
    
})();