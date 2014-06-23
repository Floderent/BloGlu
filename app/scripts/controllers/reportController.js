'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('reportController', ['$scope', '$rootScope', '$q', '$routeParams', '$modal', '$window', 'reportService', 'queryService', 'MessageService', 'DataVisualization', function Controller($scope, $rootScope, $q, $routeParams, $modal, $window, reportService, queryService, MessageService, DataVisualization) {

        $scope.isEdit = $routeParams && $routeParams.objectId;
        $scope.report = {};
        //all available query elements
        $scope.queryElements = [];
        //selected query elements
        $scope.selectedQueryElements = [];
        //available filters
        $scope.filters = [];
        //selected filter
        $scope.selectedFilter = null;
        $scope.datavizTypes = DataVisualization;
        $scope.currentDataviz = null;

        renderPage();

        function renderPage() {
            $rootScope.increasePending("processingMessage.loading");
            $scope.filters = queryService.getFilters();
            $q.all([
                getReport(),
                queryService.getMetadatamodel()
            ]).then(function resolve(results) {
                $scope.report = results[0];
                $scope.queryElements = results[1];
                setQuery();                
            }, function reject() {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
            }).finally(function(){
                $rootScope.decreasePending("processingMessage.loading");
            });
        }


        function setQuery() {
            if ($scope.report && $scope.report.query) {
                reportService.getFullQuery($scope.report.query).then(function(result) {
                    $scope.selectedQueryElements = result.headers;
                });
            }
        }

        function getReport() {            
            var deferred = $q.defer();
            if ($scope.isEdit) {
                reportService.getReport($routeParams.objectId).then(function(result) {                    
                    deferred.resolve(result);
                });
            } else {                
                deferred.resolve({});
            }
            return deferred.promise;
        }

        $scope.addQueryElement = function(queryElement) {
            if (queryElement && $scope.selectedQueryElements.indexOf(queryElement) === -1) {
                $scope.selectedQueryElements.push(queryElement);
            }
        };

        $scope.removeQueryElement = function(queryElement) {
            if (queryElement && $scope.selectedQueryElements.indexOf(queryElement) !== -1) {
                $scope.selectedQueryElements.splice($scope.selectedQueryElements.indexOf(queryElement), 1);
            }
        };
        
        $scope.removeFilter = function(){
            $scope.selectedFilter = null;
        };

        $scope.clear = function() {
            $scope.selectedQueryElements = [];
            $scope.selectedFilter = null;
            $scope.datavizConfig = null;
        };


        $scope.$watch('selectedQueryElements', function(newValue, oldValue) {            
            $scope.report.query = reportService.getQuery($scope.selectedQueryElements, $scope.selectedFilter);
            if (newValue && oldValue && $scope.report.query) {
                reportService.executeReportQuery($scope.report.query).then(function(datavizConfig) {
                    $scope.datavizConfig = datavizConfig;
                });
            }
        }, true);


        $scope.executeQuery = function() {
            $rootScope.increasePending("processingMessage.executingQuery");
            $scope.report.query = reportService.getQuery($scope.selectedQueryElements, $scope.selectedFilter);
            if ($scope.report.query) {
                reportService.executeReportQuery($scope.report.query).then(function(queryResult) {
                    $scope.datavizConfig = queryResult;
                }, function(error){
                    $rootScope.messages.push(MessageService.errorMessage("errorMessage.executingQueryError", 2000));
                }).finally(function(){
                    $rootScope.decreasePending("processingMessage.executingQuery");
                });
            }else{
                $scope.datavizConfig = null;
                $rootScope.decreasePending("processingMessage.executingQuery");
            }
        };



        $scope.update = function() {
            $rootScope.increasePending("processingMessage.updatingData");
            reportService.saveReport($scope.report, $scope.isEdit).then(function resolve(result) {
                $rootScope.messages.push(MessageService.successMessage('successMessage.reportUpdated', 2000));
            }, function reject(error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.creatingError", 2000));
            }).finally(function(){
                $rootScope.decreasePending("processingMessage.updatingData");
            });
        };

        $scope.delete = function() {
            var modalInstance = $modal.open({
                templateUrl: "views/modal/confirm.html",
                controller: "confirmModalController",
                resolve: {
                    confirmed: function() {
                        return $scope.confirmed;
                    }
                }
            });
            modalInstance.result.then(function(confirmed) {
                if (confirmed) {
                    $rootScope.increasePending("processingMessage.deletingData");
                    reportService.deleteReport($scope.report).then(function(result) {
                        $window.history.back();
                    }, function(error) {
                        $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                    }).finally(function(){
                        $rootScope.decreasePending("processingMessage.deletingData");
                    });
                }
            }, function() {
                //exit
            });
        };


        $rootScope.$on('dataReady', renderPage);        
    }]);


