(function () {
    angular.module('bloglu.import')
        .config(configureRoute);

        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/imports', {controller: 'importListController', controllerAs:'vm', templateUrl: 'app/components/import/templates/importList.html'});
            $routeProvider.when('/imports/:objectId', {controller: 'importController', controllerAs:'vm', templateUrl: 'app/components/import/templates/import.html'});
        }        
})();