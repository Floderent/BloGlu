(function () {
    'use strict';
    
    angular.module('bloglu.engine')
            .factory('lunr', lunr);

    lunr.$inject = ['$window'];


    function lunr($window) {        
        return $window.lunr;
    }

})();


