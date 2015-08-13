(function () {
    'use strict';

    angular
            .module('bloglu.dashboard')
            .factory('dashboardService', dashboardService);

    dashboardService.$inject = ['$q', 'genericDaoService', 'reportService'];


    function dashboardService($q, genericDaoService, reportService) {

        var dashboardService = {
            rowNumber: 2,
            columnNumber: 4,            
            getDashboards: getDashboards,
            saveDashboard: saveDashboard,
            addReport: addReport,
            getDashboard: getDashboard,
            initTab: initTab,
            executeDashboard: executeDashboard,
            clearReport: clearReport,
            chooseReport: chooseReport,
            executeReport: executeReport
        };
        return dashboardService;
        
        
        function chooseReport(dashboard, reportTab, row, column){            
            return reportService.chooseReport(row, column).then(function(reportData){
                return dashboardService.addReport(dashboard, reportTab, reportData);
            });
        }
       
        function getDashboards() {
            return genericDaoService.getAll('Dashboard');
        }

        function saveDashboard(dashboard) {
            var isEdit = !!dashboard.objectId;
            return genericDaoService.save('Dashboard', dashboard, isEdit);
        }
        
        function updateDashboardReport(dashboard, row, column, reportId) {
            return $q(function (resolve, reject) {
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
                    dashboardService.saveDashboard(dashboard).then(resolve, reject);
                } else {
                    reject();
                }
            });
        }
        
        function addReport(dashboard, reportTab, reportData) {
            return $q(function (resolve, reject) {                
                if (reportData && reportData.report) {
                    if (reportData.row <= dashboardService.rowNumber && reportData.column <= dashboardService.columnNumber) {
                        updateDashboardReport(dashboard, reportData.row, reportData.column, reportData.report.reportId).then(function (updatedDashboard) {
                            return dashboardService.executeReport(reportData, reportTab).then(function(){
                                resolve(updatedDashboard);
                            });                            
                        }, reject);
                    } else {
                        resolve();
                    }
                } else {
                    resolve();
                }
            });
        }

        function getDashboard() {
            return $q(function (resolve, reject) {
                dashboardService.getDashboards().then(function (dashboards) {
                    var dashboard = {
                        name: 'mainPage',
                        reports: []
                    };
                    if (dashboards && dashboards.length > 0) {
                        resolve(dashboards[0]);
                    } else {
                        resolve(dashboard);
                    }
                }, reject);
            });
        }

        function initTab() {
            var reportTab = [];
            for (var row = 0; row < dashboardService.rowNumber; row++) {
                reportTab[row] = [];
                for (var column = 0; column < dashboardService.columnNumber; column++) {
                    reportTab[row][column] = {};
                }
            }
            return reportTab;
        }

        function executeDashboard(dashboard, reportTab) {
            return $q(function (resolve, reject) {
                var promiseArray = [];
                if (dashboard && dashboard.reports) {
                    angular.forEach(dashboard.reports, function (report) {
                        promiseArray.push(executeReport(report, reportTab));
                    });
                    $q.all(promiseArray).then(resolve, reject);
                } else {
                    resolve();
                }
            });
        }

        function clearReport(dashboard, row, column) {
            angular.forEach(dashboard.reports, function (value, index) {
                if (value.row === row && value.column === column) {
                    dashboard.reports.splice(index, 1);
                }
            });
        }        

        function isReportComplete(report){
            return report && report.objectId;
        }
        
        
        function executeReport(report, reportTab) {
            reportTab[report.row][report.column] = {loading: true};
            var getReportPromise = null;
            if(isReportComplete(report.report)){
                getReportPromise = $q.when(report.report);
            }else{
                getReportPromise = reportService.getReport(report.report);
            }
            return getReportPromise.then(function (completeReport) {
                reportService.executeReport(completeReport).then(function (reportQueryResult) {
                    reportQueryResult.type = completeReport.display;
                    reportQueryResult.title = completeReport.title;
                    var dashboardReport = {
                        queryResult: reportQueryResult,
                        columnOrder: completeReport.sort
                    };
                    return angular.extend(reportTab[report.row][report.column], dashboardReport);
                })['finally'](function () {
                    reportTab[report.row][report.column].loading = false;
                });
            });
        }        

    }
})();