'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('dashboardController', ['$scope', '$rootScope', '$location', '$routeParams', 'dashboardService', 'MessageService', function Controller($scope, $rootScope, $location, $routeParams, dashboardService, MessageService) {



        $scope.reportTab = dashboardService.initTab();
        $scope.dashboard = null;

        renderPage();


        $scope.chooseReport = function(row, column) {
            dashboardService.setNewReport(row, column);
            $location.path('reportList');
        };

        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            dashboardService.getDashboard().then(function(dashboard) {
                dashboardService.addReport(dashboard).then(function() {
                    dashboardService.executeDashboard(dashboard, $scope.reportTab).then(function() {
                    }, function(executeDashboardError) {
                    });
                }, function(addReportError) {
                });
            }, function(dashboardError) {
            })['finally'](function() {
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }


        $rootScope.$on('dataReady', renderPage);

    }]);