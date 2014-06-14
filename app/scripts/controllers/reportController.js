'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('reportController', ['$scope', '$rootScope', '$q', '$routeParams', '$modal', '$window', 'reportService', 'queryService', 'MessageService', 'DataVisualization', function Controller($scope, $rootScope, $q, $routeParams, $modal, $window, reportService, queryService, MessageService, DataVisualization) {

        $rootScope.messages = [];
        $rootScope.pending = 0;
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
            $rootScope.pending++;
            $q.all([
                getReport(),
                queryService.getMetadatamodel(),
                queryService.getFilters()
            ]).then(function resolve(results) {
                $scope.report = results[0];
                $scope.queryElements = results[1];
                $scope.filters = results[2];
                debugger;
                setQuery();

                $rootScope.pending--;
            }, function reject() {
                $rootScope.messages.push(MessageService.errorMessage('Cannot read informations from server', 2000));
                $rootScope.pending--;
            });
        }

        function getQuery() {
            var query = null;
            if ($scope.selectedQueryElements && $scope.selectedQueryElements.length > 0) {
                var select = [];
                angular.forEach($scope.selectedQueryElements, function(selectElement) {
                    select.push(selectElement.name);
                });
                query = {
                    select: select
                };
                if ($scope.selectedFilter) {
                    var filterClause = {
                        type: 'function',
                        value: $scope.selectedFilter
                    };
                    query.where = {
                        dateTime: filterClause
                    };
                }
            }
            return query;
        }

        function setQuery() {
            if ($scope.report && $scope.report.query) {
                reportService.getFullQuery($scope.report.query).then(function(result) {
                    $scope.selectedQueryElements = result.headers;                    
                });
            }
        }

        function getReport() {
            $rootScope.pending++;
            var deferred = $q.defer();
            if ($scope.isEdit) {
                reportService.getReport($routeParams.objectId).then(function(result) {
                    $rootScope.pending--;
                    deferred.resolve(result);
                });
            } else {
                $rootScope.pending--;
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


        $scope.clear = function() {
            $scope.selectedQueryElements = [];
            $scope.selectedFilter = null;
            $scope.datavizConfig = null;
        };


        $scope.$watch('selectedQueryElements', function(newValue, oldValue) {
            var query = getQuery();
            $scope.report.query = query;
            if (newValue && oldValue && query) {
                reportService.executeReportQuery(query).then(function(datavizConfig) {
                    $scope.datavizConfig = datavizConfig;
                });
            }
        }, true);



        $scope.executeQuery = function() {
            if ($scope.selectedQueryElements && $scope.selectedQueryElements.length > 0) {
                var select = [];
                angular.forEach($scope.selectedQueryElements, function(selectElement) {
                    select.push(selectElement.name);
                });
                $scope.report.query = {
                    select: select
                };
                if ($scope.selectedFilter) {
                    var filterClause = {
                        type: 'function',
                        value: $scope.selectedFilter
                    };
                    $scope.report.query.where = {
                        dateTime: filterClause
                    };
                }
                debugger;
                reportService.executeReportQuery($scope.report.query).then(function(queryResult) {
                    $scope.datavizConfig = queryResult;
                });
            }
        };



        $scope.update = function() {            
            reportService.save($scope.report, $scope.isEdit).then(function resolve(result) {
                $rootScope.messages.push(MessageService.successMessage('Report saved', 2000));
            }, function reject(error) {
                $rootScope.messages.push(MessageService.errorMessage('Problem saving the report', 2000));
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
                    reportService.deleteReport($scope.report).then(function(result) {
                        $window.history.back();
                    }, function(error) {
                        $rootScope.messages.push(MessageService.errorMessage("Problem deleting report", 2000));
                    });
                }
            }, function() {
                //exit
            });
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


