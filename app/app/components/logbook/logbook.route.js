(function () {
    angular.module('bloglu.logbook')
        .config(configureRoute);

        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/logBook', {controller: 'logBookController', controllerAs:'vm', templateUrl: 'app/components/logbook/templates/logBook.html'});
        }        
})();


