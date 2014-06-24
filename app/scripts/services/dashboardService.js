'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('dashboardService', ['$q', 'dataService', 'queryService', 'genericDaoService', 'DataVisualization', 'localizationService', 'reportService', function($q, dataService, queryService, genericDaoService, DataVisualization, localizationService, reportService) {

        var dashboardService = {
            rowNumber: 2,
            columnNumber: 4,
            row: null,
            column: null,
            reportId: null
        };

        dashboardService.setNewReport = function(row, column, reportId) {
            dashboardService.row = row;
            dashboardService.column = column;
            dashboardService.reportId = reportId;
        };
        
        dashboardService.setNewReportId = function(reportId) {            
            dashboardService.reportId = reportId;
        };

        dashboardService.getNewReport = function() {
            return {
                row: dashboardService.row,
                column: dashboardService.column,
                reportId: dashboardService.reportId
            };
        };
        
        dashboardService.clearNewReport = function(){
            dashboardService.row = null;
            dashboardService.column = null;
            dashboardService.reportId = null;
        };
        
        dashboardService.hasNewReport = function(){
            return dashboardService.column !== null && dashboardService.row !== null;
        };
        
        dashboardService.getDashboards = function() {
            return genericDaoService.getAll('Dashboard');
        };

        dashboardService.saveDashboard = function(dashboard) {
            var isEdit = !!dashboard.objectId;
            /*
            var dataToSave = dashboard;
            if(isEdit){
                dataToSave = {
                    objectId: dashboard.objectId,
                    name: dashboard.name,
                    reports: dashboard.reports
                };
            }*/
            return genericDaoService.save('Dashboard', dashboard, isEdit);
        };

        dashboardService.addReport = function(dashboard) {
            var deferred = $q.defer();
            //if (typeof row !== 'undefined' && row !== null && typeof column !== 'undefined' && column !== null && reportId) 
            if(dashboardService.hasNewReport() && dashboardService.reportId !== null) {
                if (dashboardService.row <= dashboardService.rowNumber && dashboardService.column <= dashboardService.columnNumber) {
                    updateDashboardReport(dashboard, dashboardService.row, dashboardService.column, dashboardService.reportId).then(function(updatedDashboard){
                        dashboardService.clearNewReport();
                        deferred.resolve(updatedDashboard);
                    }, deferred.reject);
                } else {
                    deferred.resolve();
                }
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        };

        dashboardService.getDashboard = function() {
            return dashboardService.getDashboards().then(function(dashboards) {
                var dashboard = {
                    name: 'mainPage',
                    reports: []
                };
                if (dashboards && dashboards.length > 0) {
                    dashboard = dashboards[0];
                }
                return dashboard;
            });
        };

        dashboardService.initTab = function() {
            var reportTab = [];
            for (var row = 0; row < dashboardService.rowNumber; row++) {
                reportTab[row] = [];
                for (var column = 0; column < dashboardService.columnNumber; column++) {
                    reportTab[row][column] = {};
                }
            }
            return reportTab;
        };

        dashboardService.executeDashboard = function(dashboard, reportTab) {
            var deferred = $q.defer();            
            var promiseArray = [];
            if (dashboard && dashboard.reports) {
                angular.forEach(dashboard.reports, function(report) {
                    promiseArray.push(executeReport(report, reportTab));
                });
                $q.all(promiseArray).then(deferred.resolve, deferred.reject);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        };

        function updateDashboardReport(dashboard, row, column, reportId) {
            var deferred = $q.defer();
            if (dashboard && dashboard.reports) {
                var reportFound = false;
                for (var i in dashboard.reports) {
                    var report = dashboard.reports[i];
                    if (report.column === column && report.row === row) {
                        report.report = reportId;
                        reportFound = true;
                        break;
                    }
                }
                if (!reportFound) {
                    dashboard.reports.push({
                        row: row,
                        column: column,
                        report: reportId
                    });
                }
                dashboardService.saveDashboard(dashboard).then(deferred.resolve, deferred.reject);
            } else {
                deferred.reject();
            }
            return deferred.promise;
        }


        function executeReport(report, reportTab) {
            return reportService.getReport(report.report).then(function(completeReport) {
                reportTab[report.row][report.column] = {loading: true};
                reportService.executeReport(completeReport).then(function(reportQueryResult) {
                    return reportTab[report.row][report.column] = reportQueryResult;
                });
            });
        }


        return dashboardService;
    }]);


