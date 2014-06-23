'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('reportListController', ['$scope', '$rootScope', '$location','$modal', 'reportService', 'MessageService', function Controller($scope, $rootScope, $location, $modal, reportService, MessageService) {
        
        $scope.reports = [];

        renderPage();

        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            reportService.getReports().then(function(reports) {            
                $scope.reports = reports;                
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage('Cannot get the reports', 2000));                
            }).finally(function(){
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }

        $scope.deleteReport = function(report) {            
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = "the " + report.title + " report";
            var modalInstance = $modal.open({
                templateUrl: "views/modal/confirm.html",
                controller: "confirmModalController",
                scope: $modalScope,
                resolve: {
                    confirmed: function() {
                        return $scope.confirmed;
                    }
                }
            });
            modalInstance.result.then(function(confirmed) {
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
                        }).finally(function(){
                            $rootScope.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function() {
                //exit
            });
        };

        $scope.editReport = function(report) {
            var path = 'report/' + report.objectId;            
            $location.path(path);
        };
        
        $rootScope.$on('dataReady', renderPage);

    }]);

