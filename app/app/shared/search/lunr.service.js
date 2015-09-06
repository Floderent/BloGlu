(function () {
    'use strict';
    
    angular.module('bloglu.search')
            .factory('lunr', lunr);

    lunr.$inject = ['$window'];


    function lunr($window) {        
        return $window.lunr;
    }

})();


