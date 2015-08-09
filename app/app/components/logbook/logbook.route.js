(function () {
    angular.module('bloglu.logbook')
        .config(configureRoute);

        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('logBook', {
                url: '/logBook?weekDate&interval&display',
                controller: 'logBookController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/logbook/templates/logBook.html'
            });
        }        
})();


