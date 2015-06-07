(function () {
    angular.module('bloglu.report')
        .config(configureRoute);
        configureRoute.$inject = ['$routeProvider'];
        
        function configureRoute($routeProvider) {
            $routeProvider.when('/reports', {controller: 'reportListController', controllerAs:'vm', templateUrl: 'app/components/report/templates/reportList.html'});
            $routeProvider.when('/reports/:objectId', {controller: 'reportController', controllerAs:'vm', templateUrl: 'app/components/report/templates/report.html'});
            $routeProvider.when('/report/', {controller: 'reportController', controllerAs:'vm', templateUrl: 'app/components/report/templates/report.html'});
        }        
})();