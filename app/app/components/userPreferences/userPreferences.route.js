(function () {
    angular.module('bloglu.userPreferences')
        .config(configureRoute);
        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('userPreferences', {
                url: '/userPreferences',
                controller: 'userPreferencesController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/userPreferences/templates/userPreferences.html'
            });
        }        
})();

