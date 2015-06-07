(function () {
    angular.module('bloglu.login')
        .config(configureRoute);
        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/login', {controller: 'loginController', controllerAs: 'vm', templateUrl: 'app/components/login/templates/login.html'});
        }        
})();