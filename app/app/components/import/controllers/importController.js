(function () {
    'use strict';

    angular.module('bloglu.import')
            .controller('importController', importController);

    importController.$inject = ['menuHeaderService','importService', 'MessageService', 'ResourceIcon'];

    function importController(menuHeaderService, importService, MessageService, ResourceIcon) {
        
        var vm = this;
        
        vm.loadingState = menuHeaderService.loadingState;
        vm.uploadProgress = 0;
        vm.file = null;
        vm.import = {};
        vm.parsedFileInfos = null;
        vm.importData = importData;
        vm.dataFormats = importService.dataFormats;
        vm.import.type = importService.dataFormats[0];
        vm.supportedEvents = vm.import.type.supportedEvents;
        vm.eventsIcons = ResourceIcon;
        
        vm.onFileSelect = onFileSelect;        
        vm.uploadAndAnalyseFile = uploadAndAnalyseFile;

        function onFileSelect(files) {            
            if (Array.isArray(files) && files.length > 0) {
                vm.file = files[0];
            }else{
                vm.file = files;
            }
        }
        
        function progressHandler(progress) {
            vm.uploadProgress = progress;            
        }
        
        
        function uploadAndAnalyseFile(){            
            return importService.uploadFile(vm.file, progressHandler)                    
                    .then(importService.downloadFile)                    
                    .then(function(fileContent){
                        return importService.getDataFromFile(fileContent, vm.import.type);
                    })
                    .then(function(dataToImport){
                        debugger;
                        return importService.batchRequestProcess(dataToImport);
                    })
                    .then(function(result){
                        debugger;        
                    }, function(error){
                        debugger;
                    });
        }
        
        

        function importData() {
            menuHeaderService.increasePending('processingMessage.importingData');
            vm.import.dateTime = new Date();
            importService.importData(vm.import, vm.file).then(function (importResult) {
                debugger;
                /*
                importService.saveImport(importResult.import, true).then(function (saveResult) {
                    MessageService.successMessage('successMessage.dataImported');
                }, function (error) {
                    MessageService.errorMessage('errorMessage.errorCreating');
                });
                */
            }, function (error) {
                MessageService.errorMessage('errorMessage.errorImporting');
            })['finally'](function () {
                menuHeaderService.decreasePending('processingMessage.importingData');
            });
        };
    }
})();
