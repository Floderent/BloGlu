(function () {

    'use strict';

    angular.module('bloglu.report')
            .controller('reportController', reportController);

    reportController.$inject = ['menuHeaderService', '$scope', '$q', '$stateParams', '$window', '$state', 'DataVisualization', 'reportService', 'queryService', 'MessageService', 'Utils'];

    function reportController(menuHeaderService, $scope, $q, $stateParams, $window, $state, DataVisualization, reportService, queryService, MessageService, Utils) {

        var vm = this;

        vm.loadingState = menuHeaderService.loadingState;
        vm.isEdit = $stateParams && $stateParams.objectId;
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
        
        vm.beginDateOpened = false;
        vm.endDateOpened = false;
        vm.openBeginDate = openBeginDate;
        vm.openEndDate = openEndDate;

        renderPage();

        function renderPage() {
            menuHeaderService.increasePending("processingMessage.loading");
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
                MessageService.errorMessage("errorMessage.loadingError", 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending("processingMessage.loading");
            });
        }
        
        function openBeginDate($event){
            $event.preventDefault();
            $event.stopPropagation();
            if (vm.beginDateOpened) {
                vm.beginDateOpened = false;
            } else {
                vm.beginDateOpened = true;
            }
        }
        
        function openEndDate($event){
            $event.preventDefault();
            $event.stopPropagation();
            if (vm.endDateOpened) {
                vm.endDateOpened = false;
            } else {
                vm.endDateOpened = true;
            }
        }
        
        
        function getReport() {
            return $q(function (resolve, reject) {
                if (vm.isEdit) {
                    reportService.getReport($stateParams.objectId).then(function (result) {
                        resolve(result);
                    });
                } else {
                    resolve();
                }
            });
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
            menuHeaderService.increasePending("processingMessage.executingQuery");
            reportService.executeReportQuery(vm.report).then(function (queryResult) {
                queryResult.type = vm.report.display;
                vm.datavizConfig = queryResult;
            }, function (error) {
                MessageService.errorMessage("errorMessage.executingQueryError", 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending("processingMessage.executingQuery");
            });
        }

        function update() {
            menuHeaderService.increasePending("processingMessage.updatingData");
            reportService.saveReport(vm.report, vm.isEdit).then(function (result) {
                vm.report = angular.extend(vm.report, result);
                if (!vm.isEdit) {
                    $state.go('report', {objectId: vm.report.objectId});
                }
                MessageService.successMessage('successMessage.reportUpdated', 2000);
            }, function (error) {
                MessageService.errorMessage("errorMessage.creatingError", 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending("processingMessage.updatingData");
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
                    menuHeaderService.increasePending("processingMessage.deletingData");
                    reportService.deleteReport(vm.report).then(function (result) {
                        $window.history.back();
                    }, function (error) {
                        MessageService.errorMessage('errorMessage.deletingError', 2000);
                    })['finally'](function () {
                        menuHeaderService.decreasePending("processingMessage.deletingData");
                    });
                }
            }, function () {
                //exit
            });
        }

        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();
