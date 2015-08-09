(function () {
    angular.module('bloglu.period')
        .config(configureRoute);
        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('periods', {
                url: '/periods',
                controller: 'periodController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/period/templates/period.html'
            });
        }        
})();