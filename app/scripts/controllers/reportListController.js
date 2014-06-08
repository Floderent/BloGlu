'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('reportListController', ['$scope', '$rootScope', '$q', '$window','$location','$modal', 'reportService', 'MessageService', function Controller($scope, $rootScope, $q, $window,$location, $modal, reportService, MessageService) {

        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.reports = [];

        renderPage();

        function renderPage() {
            $rootScope.pending++;
            reportService.getReports().then(function(reports) {            
                $scope.reports = reports;
                $rootScope.pending--;
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage('Cannot get the reports', 2000));
                $rootScope.pending--;
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
                        $rootScope.pending++;                        
                        reportService.deleteReport(report).then(function(result) {
                            var reportIndex = -1;
                            $scope.reports.forEach(function(rep, index) {
                                if (rep.objectId && rep.objectId === report.objectId) {
                                    reportIndex = index;
                                }
                            });
                            if (reportIndex !== -1) {
                                $scope.reports.splice(reportIndex, 1);
                            }                            
                            $rootScope.pending--;
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('Problem deleting report', 2000));
                            $rootScope.pending--;
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

        $window.addEventListener('dataReady', renderPage);

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            $rootScope.pending = 0;
            //clear messages
            $rootScope.messages = [];
            //clear events
            $window.removeEventListener('dataReady', renderPage);
        });



    }]);

