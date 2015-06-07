(function () {
    angular.module('bloglu.event')
        .config(configureRoute);

        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/event/:eventType/:objectId', {controller: 'eventController', controllerAs:'vm', templateUrl: 'app/components/event/templates/event.html'});
            $routeProvider.when('/event/:eventType', {controller: 'eventController', controllerAs:'vm', templateUrl: 'app/components/event/templates/event.html'});
        }        
})();


