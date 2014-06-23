'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('dashboardController', ['$scope', '$rootScope', 'reportService', 'MessageService', function Controller($scope, $rootScope, reportService, MessageService) {
        
        var rowNumber = 2;
        var columnNumber = 4;

        $scope.reportTab = [];
        renderPage();

        function renderPage() {            
            initTab();
            getDashboard().then(executeDashboard);
        }

        function initTab() {
            for (var row = 0; row < rowNumber; row++) {
                $scope.reportTab[row] = [];
                for (var column = 0; column < columnNumber; column++) {
                    $scope.reportTab[row][column] = {};
                }
            }
        }

        function getDashboard() {
            $rootScope.increasePending("processingMessage.loadingData");
            return reportService.getDashboards().then(function(dashboards) {
                var dashboard = null;                
                if (dashboards && dashboards.length > 0) {
                    dashboard = dashboards[0];
                }
                return dashboard;
            }).finally(function(){
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }

        function executeDashboard(dashboard) {
            if (dashboard && dashboard.reports) {                
                angular.forEach(dashboard.reports, function(report) {                    
                    reportService.getReport(report.report).then(function(completeReport) {                        
                        reportService.executeReport(completeReport).then(function(reportQueryResult) {
                            $scope.reportTab[report.row][report.column] = reportQueryResult;
                        }, function(error) {
                        });
                    });
                });
            }
        }
        
        $rootScope.$on('dataReady', renderPage);        
        
    }]);