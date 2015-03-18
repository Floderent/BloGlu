(function () {
    'use strict';

    angular.module('bloglu.logbook')
            .controller('chooseEventController', chooseEventController);

    chooseEventController.$inject = ['$modalInstance'];

    function chooseEventController($modalInstance) {
        
        var vm = this;
        vm.code = null;
        vm.ok = ok;
        vm.cancel = cancel;
        vm.selectType = selectType;        
        
        function selectType(key) {
            vm.code = parseInt(key);
        }
        function ok() {
            $modalInstance.close(vm.code);
        }
        function cancel() {
            $modalInstance.dismiss(0);
        }
    }
})();
