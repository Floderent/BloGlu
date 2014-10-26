'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('reportListController', ['$scope', '$rootScope', '$location', 'reportService', 'MessageService','dashboardService', 'Utils', function Controller($scope, $rootScope, $location, reportService, MessageService, dashboardService, Utils) {

        $scope.reports = [];        
        renderPage();
        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            reportService.getReports().then(function(reports) {
                $scope.reports = reports;
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage('Cannot get the reports', 2000));
            })['finally'](function() {
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }

        $scope.deleteReport = function(report) {            
            var modalScope = {
                       confirmTitle:'confirm.pageTitle',
                       confirmMessage:'confirm.deletionMessage',
                       confirmYes:'confirm.yes',
                       confirmNo:'confirm.no',
                       message: report.title
                   };
            Utils.openConfirmModal(modalScope).then(function(confirmed) {
                if (confirmed) {
                    if (report.objectId) {
                        $rootScope.increasePending("processingMessage.deletingData");
                        reportService.deleteReport(report).then(function(result) {
                            var reportIndex = -1;
                            angular.forEach($scope.reports, function(rep, index) {
                                if (rep.objectId && rep.objectId === report.objectId) {
                                    reportIndex = index;
                                }
                            });
                            if (reportIndex !== -1) {
                                $scope.reports.splice(reportIndex, 1);
                            }
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                        })['finally'](function() {
                            $rootScope.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function() {
                //exit
            });
        };

        $scope.editReport = function(report) {            
            //if column and row query param, redirect to dashboard when doubleclicking on report            
            if (dashboardService.hasNewReport()) {
                dashboardService.setNewReportId(report.objectId);
                $location.path('dashboard');
            } else {
                //else edit the report
                var path = 'report/' + report.objectId;
                $location.url($location.path());
                $location.path(path);
            }

        };
        $rootScope.$on('dataReady', renderPage);
    }]);

