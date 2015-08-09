(function () {
    angular.module('bloglu.dashboard')
            .config(configureRoute);

    configureRoute.$inject = ['$stateProvider'];

    function configureRoute($stateProvider) {
        $stateProvider.state('dashboard', {
            url: '/dashboard',
            controller: 'dashboardController',
            controllerAs: 'vm',
            templateUrl: 'app/components/dashboard/templates/dashboard.html'
        });
    }
})();


