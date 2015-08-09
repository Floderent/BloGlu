(function () {
    angular.module('bloglu.range')
        .config(configureRoute);
        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('ranges', {
                url: '/ranges',
                controller: 'rangeController',
                controllerAs:'vm', 
                templateUrl: 'app/components/range/templates/range.html'
            });
        }        
})();