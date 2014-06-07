'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('reportController', ['$scope', '$rootScope', '$q', '$routeParams', '$modal', '$window', 'reportService', 'dataService', 'queryService', 'MessageService', 'DataVisualization', function Controller($scope, $rootScope, $q, $routeParams, $modal, $window, reportService, dataService, queryService, MessageService, DataVisualization) {

        $rootScope.messages = [];
        $rootScope.pending = 0;

        $scope.measures = [];
        $scope.selectedMeasure = null;
        $scope.levels = [];
        $scope.selectedLevel = null;
        $scope.selectedQueryElements = [];


        $scope.queryElements = [];

        $scope.filters = [];
        $scope.selectedFilter = null;

        $scope.orderBy = [];

        $scope.reportData = [];
        $scope.headers = [];

        $scope.isEdit = $routeParams && $routeParams.objectId;

        $scope.datavizTypes = DataVisualization;
        $scope.currentDataviz = null;

        $scope.columnOrder = [];

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
                $rootScope.pending--;
            }, function reject() {
                $rootScope.messages.push(MessageService.errorMessage('Cannot read informations from server', 2000));
                $rootScope.pending--;
            });
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
            $scope.reportData = [];
            $scope.selectedFilter = null;
            $scope.datavizConfig = null;
        };


        $scope.$watch('selectedQueryElements', function(newValue, oldValue) {
            var query = getQuery();
            if (newValue && oldValue && query && newValue !== oldValue) {
                executeReportQuery(query).then(function(datavizConfig) {
                    $scope.datavizConfig = datavizConfig;
                });
            }
        }, true);



        $scope.executeQuery = function() {
            if ($scope.selectedQueryElements && $scope.selectedQueryElements.length > 0) {
                var select = [];
                $scope.selectedQueryElements.forEach(function(selectElement) {
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
                reportService.executeReportQuery($scope.report.query).then(function(queryResult) {
                    $scope.datavizConfig = queryResult;
                });
            }
        };
        function executeReportQuery(query) {
            return reportService.executeReportQuery(query).then(function(queryResult) {
                return queryResult;
            });
        }


        function getQuery() {
            var query = null;
            if ($scope.isEdit) {

            } else {
                if ($scope.selectedQueryElements && $scope.selectedQueryElements.length > 0) {
                    var select = [];
                    $scope.selectedQueryElements.forEach(function(selectElement) {
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
            }
            return query;
        }


        function getReport() {
            var deferred = $q.defer();
            if ($scope.isEdit) {
                dataService.queryLocal('Report', {where: {objectId: $routeParams.objectId}}).then(function(result) {
                    var report = {};
                    if (result && result.length === 1) {
                        report = result[0];
                    }
                    deferred.resolve(report);
                }, function(error) {
                    $scope.isEdit = false;
                    $rootScope.pending--;
                    deferred.reject(error);
                });
            } else {
                deferred.resolve({});
            }
            return deferred.promise;
        }


        $scope.update = function() {
            var report = $scope.report;
            var savingPromise = null;
            if ($scope.isEdit) {
                savingPromise = dataService.update('Report', report.objectId, report);
            } else {
                savingPromise = dataService.save('Report', report);
            }
            savingPromise.then(function resolve(result) {
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
                    dataService.delete('Report', $scope.report.objectId).then(function(result) {
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
            //clear messages
            //clear events
            $window.removeEventListener('dataReady', renderPage);
        });
    }]);


