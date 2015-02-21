'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('dashboardController', ['$scope', '$rootScope', '$location', '$routeParams', 'dashboardService', 'MessageService', function Controller($scope, $rootScope, $location, $routeParams, dashboardService, MessageService) {

        $scope.reportTab = dashboardService.initTab();
        $scope.dashboard = null;        

        renderPage();

        $scope.chooseReport = function(row, column) {            
            dashboardService.setNewReport(row, column);
            $location.path('reports');
        };
        
        $scope.clearReport = function(row, column){            
            $scope.reportTab[row][column] = {};
            dashboardService.clearReport($scope.dashboard, row, column);
            dashboardService.saveDashboard($scope.dashboard);
        };
        
        
        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            dashboardService.getDashboard().then(function(dashboard) {
                $scope.dashboard = dashboard;                
                dashboardService.addReport(dashboard).then(function() {
                    dashboardService.executeDashboard(dashboard, $scope.reportTab).then(function() {
                    }, function(executeDashboardError) {
                        //error message
                    })['finally'](function(){                        
                    });
                }, function(addReportError) {
                    //error message
                });
            }, function(dashboardError) {
            })['finally'](function() {                
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }

        $rootScope.$on('dataReady', renderPage);

    }]);