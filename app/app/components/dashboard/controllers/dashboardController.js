(function () {
    'use strict';

    angular
            .module('bloglu.dashboard')
            .controller('dashboardController', dashboardController);

    dashboardController.$inject = ['$scope','$rootScope', '$location', 'dashboardService'];


    function dashboardController($scope, $rootScope, $location, dashboardService) {
        
        var vm = this;
        
        vm.reportTab = dashboardService.initTab();
        vm.dashboard = null;
        vm.chooseReport = chooseReport;
        vm.clearReport = clearReport;        

        renderPage();

        function chooseReport(row, column) {
            dashboardService.setNewReport(row, column);
            $location.path('reports');
        }

        function clearReport(row, column) {
            vm.reportTab[row][column] = {};
            dashboardService.clearReport(vm.dashboard, row, column);
            dashboardService.saveDashboard(vm.dashboard);
        }

        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            dashboardService.getDashboard().then(function (dashboard) {
                vm.dashboard = dashboard;
                dashboardService.addReport(dashboard).then(function () {
                    dashboardService.executeDashboard(dashboard, vm.reportTab).then(function () {
                    }, function (executeDashboardError) {
                        //error message
                    })['finally'](function () {
                    });
                }, function (addReportError) {
                    //error message
                });
            }, function (dashboardError) {
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }
        
        var unbind = $rootScope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);        
        
    }
})();