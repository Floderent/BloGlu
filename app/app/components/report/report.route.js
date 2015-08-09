(function () {
    angular.module('bloglu.report')
        .config(configureRoute);
        configureRoute.$inject = ['$stateProvider'];
        
        function configureRoute($stateProvider) {
            $stateProvider.state('reports', {
                url: '/reports',
                controller: 'reportListController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/report/templates/reportList.html'
            });
            $stateProvider.state('reports.objectId', {
                url: '/reports/:objectId',
                controller: 'reportController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/report/templates/report.html'
            });
            $stateProvider.state('report', {
                url: '/report',
                controller: 'reportController', 
                controllerAs:'vm', 
                templateUrl: 'app/components/report/templates/report.html'
            });
        }        
})();