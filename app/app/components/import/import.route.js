(function () {
    angular.module('bloglu.import')
        .config(configureRoute);

        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('imports', {
                url: '/imports',
                controller: 'importListController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/import/templates/importList.html'
            });
            $stateProvider.state('imports.objectId', {
                url: '/imports/:objectId',
                controller: 'importController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/import/templates/import.html'
            });
        }        
})();