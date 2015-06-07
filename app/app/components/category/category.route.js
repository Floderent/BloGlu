(function () {
    angular.module('bloglu.category')
        .config(configureRoute);

        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/eventTypes', {controller: 'categoryController', controllerAs:'vm', templateUrl: 'app/components/category/templates/category.html'});
        }        
})();


