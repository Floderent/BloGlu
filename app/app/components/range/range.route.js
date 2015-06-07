(function () {
    angular.module('bloglu.range')
        .config(configureRoute);
        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/ranges', {controller: 'rangeController',controllerAs:'vm', templateUrl: 'app/components/range/templates/range.html'});
        }        
})();