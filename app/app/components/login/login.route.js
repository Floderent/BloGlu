(function () {
    angular.module('bloglu.login')
        .config(configureRoute);
        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('login', {
                url: '/login',
                controller: 'loginController', 
                controllerAs: 'vm', 
                templateUrl: 'app/components/login/templates/login.html'
            });
        }        
})();