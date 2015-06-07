(function () {
    angular.module('bloglu.userPreferences')
        .config(configureRoute);
        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/userPreferences', {controller: 'userPreferencesController', controllerAs:'vm', templateUrl: 'app/components/userPreferences/templates/userPreferences.html'});
        }        
})();

