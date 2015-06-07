(function () {
    angular.module('bloglu.dashboard')
        .config(configureRoute);

        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/dashboard', {controller: 'dashboardController', controllerAs:'vm', templateUrl: 'app/components/dashboard/templates/dashboard.html'});
        }        
})();


