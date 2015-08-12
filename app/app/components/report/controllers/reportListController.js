(function () {

    'use strict';

    angular.module('bloglu.report')
            .controller('reportListController', reportListController);

    reportListController.$inject = ['menuHeaderService', '$scope', '$state', 'reportService', 'MessageService', 'dashboardService', 'Utils'];


    function reportListController(menuHeaderService, $scope, $state, reportService, MessageService, dashboardService, Utils) {
        
        var vm = this;
        
        vm.reports = [];        
        
        vm.deleteReport = deleteReport;
        vm.editReport = editReport;        

        renderPage();
        function renderPage() {
            menuHeaderService.increasePending("processingMessage.loadingData");
            reportService.getReports().then(function (reports) {
                vm.reports = reports;
            }, function (error) {
                MessageService.errorMessage('Cannot get the reports', 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending("processingMessage.loadingData");
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
                        menuHeaderService.increasePending("processingMessage.deletingData");
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
                            MessageService.errorMessage('errorMessage.deletingError', 2000);
                        })['finally'](function () {
                            menuHeaderService.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function () {
                //exit
            });
        }

        function editReport(report) {            
            $state.go('reports',{objectId: report.objectId});            
        }

        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();
