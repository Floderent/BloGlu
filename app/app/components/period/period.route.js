(function () {
    angular.module('bloglu.period')
        .config(configureRoute);
        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/periods', {controller: 'periodController', controllerAs:'vm', templateUrl: 'app/components/period/templates/period.html'});
        }        
})();