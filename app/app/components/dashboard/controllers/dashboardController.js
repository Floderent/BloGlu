(function () {
    'use strict';

    angular.module('bloglu.dashboard')
            .controller('dashboardController', dashboardController);

    dashboardController.$inject = ['$scope', 'menuHeaderService', '$state', 'dashboardService'];


    function dashboardController($scope, menuHeaderService, $state, dashboardService) {

        var vm = this;
        
        vm.loadingState = menuHeaderService.loadingState;
        vm.reportTab = dashboardService.initTab();
        vm.dashboard = null;
        vm.chooseReport = chooseReport;
        vm.clearReport = clearReport;

        renderPage();

        function chooseReport(row, column) {            
            dashboardService.setNewReport(row, column);
            $state.go('reports');
        }

        function clearReport(row, column) {
            vm.reportTab[row][column] = {};
            dashboardService.clearReport(vm.dashboard, row, column);
            dashboardService.saveDashboard(vm.dashboard);
        }

        function renderPage() {            
            menuHeaderService.increasePending('processingMessage.loadingData');
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
                menuHeaderService.decreasePending('processingMessage.loadingData');
            });
        }

        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);

    }
})();