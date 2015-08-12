(function () {
    'use strict';

    angular.module('bloglu.import')
            .controller('importController', importController);

    importController.$inject = ['menuHeaderService','importService', 'MessageService', 'ResourceIcon'];

    function importController(menuHeaderService, importService, MessageService, ResourceIcon) {
        
        var vm = this;
        
        vm.loadingState = menuHeaderService.loadingState;
        vm.file = null;
        vm.import = {};
        vm.onFileSelect = onFileSelect;
        vm.importData = importData;
        vm.dataFormats = importService.dataFormats;
        vm.import.type = importService.dataFormats[0];
        vm.supportedEvents = vm.import.type.supportedEvents;
        vm.eventsIcons = ResourceIcon;        

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
                    MessageService.successMessage('successMessage.dataImported');
                }, function (error) {
                    MessageService.errorMessage('errorMessage.errorCreating');
                });
            }, function (error) {
                MessageService.errorMessage('errorMessage.errorImporting');
            })['finally'](function () {
                menuHeaderService.decreasePending('processingMessage.importingData');
            });
        };
    }
})();
