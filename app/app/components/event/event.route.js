(function () {
    angular.module('bloglu.event')
            .config(configureRoute);

    configureRoute.$inject = ['$stateProvider'];

    function configureRoute($stateProvider) {
        
        $stateProvider.state('event-eventType-objectId', {
            url: '/event/:eventType/:objectId',
            controller: 'eventController',
            controllerAs: 'vm',
            templateUrl: 'app/components/event/templates/event.html'
        });        
        $stateProvider.state('event-eventType', {
            url: '/event/:eventType',
            controller: 'eventController',
            controllerAs: 'vm',
            templateUrl: 'app/components/event/templates/event.html'
        });
    }
})();


