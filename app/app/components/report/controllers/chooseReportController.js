(function () {
    'use strict';
    
    angular.module('bloglu.report')
            .controller('chooseReportController', chooseReportController);

    chooseReportController.$inject = ['$modalInstance', 'row', 'column', 'reports'];
    
    function chooseReportController($modalInstance, row, column, reports){
        
        var vm = this;
        
        vm.reports = reports;
        vm.cancel = cancel;
        vm.chooseReport = chooseReport;
        
        function chooseReport(report) {
            $modalInstance.close({
                report: report,
                row: row,
                column: column
            });
        };
        function cancel() {
            $modalInstance.dismiss(0);
        }
    }
    
    
})();

