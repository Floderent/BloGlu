(function () {
    'use strict';

    angular.module('bloglu.import')
            .controller('importController', importController);

    importController.$inject = ['menuHeaderService', 'importService', 'MessageService'];

    function importController(menuHeaderService, importService, MessageService) {
        
        var vm = this;
        
        vm.loadingState = menuHeaderService.loadingState;
        vm.file = null;
        vm.import = {};
        vm.onFileSelect = onFileSelect;
        vm.importData = importData;

        function onFileSelect(files) {
            if (Array.isArray(files) && files.length > 0) {
                vm.file = files[0];
            }
        };

        function importData() {
            menuHeaderService.increasePending('processingMessage.importingData');
            vm.import.dateTime = new Date();
            importService.importData(vm.import, vm.file).then(function (importResult) {
                importService.saveImport(importResult.import, true).then(function (saveResult) {
                    MessageService.successMessage('successMessage.dataImported', 2000);
                }, function (error) {
                    MessageService.errorMessage('errorMessage.errorCreating', 2000);
                });
            }, function (error) {
                MessageService.errorMessage('errorMessage.errorImporting', 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending('processingMessage.importingData');
            });
        };
    }
})();
