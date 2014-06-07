'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('dashboardController', ['$scope', '$rootScope', '$window', 'dataService', 'reportService', 'MessageService', function Controller($scope, $rootScope, $window, dataService, reportService, MessageService) {
        $rootScope.messages = [];
        $rootScope.pending = 0;

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
            return dataService.queryLocal('Dashboard').then(function(dashboards) {
                var dashboard = null;                
                if (dashboards && dashboards.length > 0) {
                    dashboard = dashboards[0];
                }
                return dashboard;
            });
        }

        function executeDashboard(dashboard) {
            if (dashboard && dashboard.reports) {                
                dashboard.reports.forEach(function(report) {                    
                    dataService.queryLocal('Report',{where: {objectId:report.report}}).then(function(completeReports) {
                        reportService.executeReport(completeReports[0]).then(function(reportQueryResult) {
                            $scope.reportTab[report.row][report.column] = reportQueryResult;
                        }, function(error) {
                        });
                    });
                });
            }
        }

        $window.addEventListener('dataReady', renderPage);


        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            //clear messages
            $rootScope.messages = [];
            //clear events
            $window.removeEventListener('dataReady',renderPage);
        });
    }]);