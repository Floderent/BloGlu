(function () {
    angular.module('bloglu.category')
        .config(configureRoute);

        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('eventTypes', {
                url: '/eventTypes',
                templateUrl: 'app/components/category/templates/category.html',
                controller: 'categoryController', 
                controllerAs:'vm'                
            });
        }        
})();


