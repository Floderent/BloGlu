(function () {

    'use strict';

    angular.module('bloglu.report')
            .controller('reportController', reportController);

    reportController.$inject = ['$rootScope', '$scope', '$q', '$routeParams', '$window', '$location', 'DataVisualization', 'reportService', 'queryService', 'MessageService', 'Utils'];

    function reportController($rootScope, $scope, $q, $routeParams, $window, $location, DataVisualization, reportService, queryService, MessageService, Utils) {
        
        var vm = this;

        vm.isEdit = $routeParams && $routeParams.objectId;
        vm.form = {};
        vm.report = {};
        vm.selectedQueryElement = null;
        //all available query elements
        vm.queryElements = [];
        //available filters
        vm.filters = [];
        //selected filter
        vm.selectedFilter = null;
        vm.datavizTypes = DataVisualization;        
        
        vm.addQueryElement = addQueryElement;
        vm.removeQueryElement = removeQueryElement;
        vm.removeFilter = removeFilter;
        vm.clear = clear;
        vm.changeDisplay = changeDisplay;
        vm.addFilter = addFilter;
        vm.executeQuery = executeQuery;
        vm.update = update;
        vm.deleteReport = deleteReport;

        renderPage();

        function renderPage() {
            $rootScope.increasePending("processingMessage.loading");
            vm.filters = queryService.getFilters();
            $q.all([
                getReport(),
                queryService.getMetadatamodel()
            ]).then(function (results) {
                if (results[0]) {
                    vm.report = results[0];
                }
                vm.queryElements = results[1];
                vm.executeQuery();
            }, function () {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.loading");
            });
        }

        function getReport() {
            var deferred = $q.defer();
            if (vm.isEdit) {
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
            if (vm.selectedFilter) {
                filterparams = {};
                if (vm.selectedFilter.customParameters) {
                    angular.forEach(vm.selectedFilter.customParameters, function (customParameter) {
                        filterparams[customParameter] = vm[customParameter];
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

        function addQueryElement(queryElement) {            
            if (!vm.report.select) {
                vm.report.select = [];
            }
            if (queryElement && reportService.indexOfElement(vm.report.select, queryElement) === -1) {
                vm.report.select.push({name: queryElement.name, title: queryElement.title});
                vm.executeQuery();
            }
        }

        function removeQueryElement(queryElement) {
            if (queryElement && reportService.indexOfElement(vm.report.select, queryElement) !== -1) {
                vm.report.select.splice(reportService.indexOfElement(vm.report.select, queryElement), 1);
                vm.executeQuery();
            }
        }

        function removeFilter() {
            vm.report.filter = [];
            vm.executeQuery();
        }

        function clear() {
            vm.report.select = [];
            vm.report.filter = [];
            vm.datavizConfig = null;
            vm.executeQuery();
        }

        function changeDisplay() {
            vm.executeQuery();
        }

        function addFilter(selectedFilter) {
            vm.report.filter = [];
            if (selectedFilter.customParameters) {
                if (vm.form.filterValueForm.$valid) {
                    vm.report.filter.push(getSelectedFilter(selectedFilter));
                    vm.executeQuery();
                } else {
                    //error in filter value form
                }
            } else {
                vm.report.filter.push(getSelectedFilter(selectedFilter));
                vm.executeQuery();
            }
        }

        function executeQuery() {
            $rootScope.increasePending("processingMessage.executingQuery");
            reportService.executeReportQuery(vm.report).then(function (queryResult) {
                queryResult.type = vm.report.display;
                vm.datavizConfig = queryResult;
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.executingQueryError", 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.executingQuery");
            });
        }

        function update() {
            $rootScope.increasePending("processingMessage.updatingData");
            reportService.saveReport(vm.report, vm.isEdit).then(function (result) {
                vm.report = angular.extend(vm.report, result);
                if (!vm.isEdit) {
                    var path = 'report/' + vm.report.objectId;
                    $location.url($location.path());
                    $location.path(path);
                }
                $rootScope.messages.push(MessageService.successMessage('successMessage.reportUpdated', 2000));
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.creatingError", 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.updatingData");
            });
        }

        function deleteReport() {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: 'confirm.deletionMessage',
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    $rootScope.increasePending("processingMessage.deletingData");
                    reportService.deleteReport(vm.report).then(function (result) {
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
        }

        var unbind = $rootScope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();
