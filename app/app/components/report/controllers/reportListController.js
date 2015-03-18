(function () {

    'use strict';

    angular.module('bloglu.report')
            .controller('reportListController', reportListController);

    reportListController.$inject = ['$rootScope', '$location', 'reportService', 'MessageService', 'dashboardService', 'Utils'];


    function reportListController($rootScope, $location, reportService, MessageService, dashboardService, Utils) {
        
        var vm = this;
        
        vm.reports = [];
        vm.addReportMode = dashboardService.hasNewReport();
        
        vm.deleteReport = deleteReport;
        vm.editReport = editReport;
        vm.addReportToDashboard = addReportToDashboard;

        renderPage();
        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            reportService.getReports().then(function (reports) {
                vm.reports = reports;
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage('Cannot get the reports', 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }

        function deleteReport(report) {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: 'confirm.deletionMessage',
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no',
                message: report.title
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    if (report.objectId) {
                        $rootScope.increasePending("processingMessage.deletingData");
                        reportService.deleteReport(report).then(function (result) {
                            var reportIndex = -1;
                            angular.forEach(vm.reports, function (rep, index) {
                                if (rep.objectId && rep.objectId === report.objectId) {
                                    reportIndex = index;
                                }
                            });
                            if (reportIndex !== -1) {
                                vm.reports.splice(reportIndex, 1);
                            }
                        }, function (error) {
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                        })['finally'](function () {
                            $rootScope.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function () {
                //exit
            });
        }

        function editReport(report) {
            var path = 'reports/' + report.objectId;
            $location.url($location.path());
            $location.path(path);
        }

        function addReportToDashboard(report) {
            dashboardService.setNewReportId(report.objectId);
            $location.path('dashboard');
        }


        $rootScope.$on('dataReady', renderPage);
    }
})();
