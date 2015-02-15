'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('reportController', [
    '$scope',
    '$rootScope',
    '$q',
    '$routeParams',
    '$window',
    '$location',
    'DataVisualization',
    'reportService',
    'queryService',
    'MessageService',
    'Utils', function Controller(
            $scope,
            $rootScope,
            $q,
            $routeParams,
            $window,
            $location,
            DataVisualization,
            reportService,
            queryService,
            MessageService,
            Utils) {

        $scope.isEdit = $routeParams && $routeParams.objectId;
        $scope.form = {};
        $scope.report = {};
        //all available query elements
        $scope.queryElements = [];
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
            ]).then(function (results) {
                if (results[0]) {
                    $scope.report = results[0];
                }
                $scope.queryElements = results[1];
                $scope.executeQuery();
            }, function () {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.loading");
            });
        }

        function getReport() {
            var deferred = $q.defer();
            if ($scope.isEdit) {
                reportService.getReport($routeParams.objectId).then(function (result) {
                    deferred.resolve(result);
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function getFilterParams() {
            var filterparams = null;
            if ($scope.selectedFilter) {
                filterparams = {};
                if ($scope.selectedFilter.customParameters) {
                    angular.forEach($scope.selectedFilter.customParameters, function (customParameter) {
                        filterparams[customParameter] = $scope[customParameter];
                    });
                }
            }
            return filterparams;
        }

        function getSelectedFilter(selectedFilter) {
            var newFilter = {};
            newFilter[selectedFilter.field] = {};
            newFilter[selectedFilter.field].type = 'function';
            newFilter[selectedFilter.field].title = selectedFilter.title;
            newFilter[selectedFilter.field].value = selectedFilter.id;
            newFilter[selectedFilter.field].customParameters = selectedFilter.customParameters;
            newFilter[selectedFilter.field].filterValue = getFilterParams();
            return newFilter;
        }

        $scope.addQueryElement = function (queryElement) {
            if (!$scope.report.select) {
                $scope.report.select = [];
            }
            if (queryElement && reportService.indexOfElement($scope.report.select, queryElement) === -1) {
                $scope.report.select.push({name: queryElement.name, title: queryElement.title});
                $scope.executeQuery();
            }
        };

        $scope.removeQueryElement = function (queryElement) {
            if (queryElement && reportService.indexOfElement($scope.report.select, queryElement) !== -1) {
                $scope.report.select.splice(reportService.indexOfElement($scope.report.select, queryElement), 1);
                $scope.executeQuery();
            }
        };

        $scope.removeFilter = function () {
            $scope.report.filter = [];
            $scope.executeQuery();
        };

        $scope.clear = function () {
            $scope.report.select = [];
            $scope.report.filter = [];
            $scope.datavizConfig = null;
            $scope.executeQuery();
        };

        $scope.changeDisplay = function () {
            $scope.executeQuery();
        };

        $scope.addFilter = function (selectedFilter) {
            $scope.report.filter = [];
            if (selectedFilter.customParameters) {
                if ($scope.form.filterValueForm.$valid) {
                    $scope.report.filter.push(getSelectedFilter(selectedFilter));
                    $scope.executeQuery();
                } else {
                    //error in filter value form
                }
            } else {
                $scope.report.filter.push(getSelectedFilter(selectedFilter));
                $scope.executeQuery();
            }
        };

        $scope.executeQuery = function () {
            $rootScope.increasePending("processingMessage.executingQuery");
            reportService.executeReportQuery($scope.report).then(function (queryResult) {
                queryResult.type = $scope.report.display;
                $scope.datavizConfig = queryResult;
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.executingQueryError", 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.executingQuery");
            });
        };

        $scope.update = function () {
            $rootScope.increasePending("processingMessage.updatingData");
            reportService.saveReport($scope.report, $scope.isEdit).then(function (result) {
                $scope.report = angular.extend($scope.report, result);
                if (!$scope.isEdit) {
                    var path = 'report/' + $scope.report.objectId;
                    $location.url($location.path());
                    $location.path(path);
                }
                $rootScope.messages.push(MessageService.successMessage('successMessage.reportUpdated', 2000));
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.creatingError", 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.updatingData");
            });
        };

        $scope.delete = function () {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: 'confirm.deletionMessage',
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    $rootScope.increasePending("processingMessage.deletingData");
                    reportService.deleteReport($scope.report).then(function (result) {
                        $window.history.back();
                    }, function (error) {
                        $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                    })['finally'](function () {
                        $rootScope.decreasePending("processingMessage.deletingData");
                    });
                }
            }, function () {
                //exit
            });
        };

        $rootScope.$on('dataReady', renderPage);
    }]);