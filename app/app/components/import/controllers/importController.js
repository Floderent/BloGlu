(function () {
    'use strict';

    angular.module('bloglu.import')
            .controller('importController', importController);

    importController.$inject = ['$state','menuHeaderService','importService', 'MessageService', 'ResourceIcon'];

    function importController($state, menuHeaderService, importService, MessageService, ResourceIcon) {
        
        var vm = this;
        
        vm.loadingState = menuHeaderService.loadingState;
        vm.uploadProgress = 0;
        vm.file = null;
        vm.eventsToImport = null;
        
        vm.import = {};
        vm.parsedFileInfos = null;        
        vm.dataFormats = importService.dataFormats;
        vm.import.type = importService.dataFormats[0].name;
        vm.supportedEvents = vm.import.type.supportedEvents;
        vm.eventsIcons = ResourceIcon;
        
        vm.fileOptions = {
            size: {max:'10MB'},
            accept: vm.import.type.fileExtension
        };
        
        vm.onFileSelect = onFileSelect;        
        vm.uploadAndAnalyseFile = uploadAndAnalyseFile;
        vm.insertData = insertData;

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
            menuHeaderService.increasePending('processingMessage.uploadingData');
            return importService.uploadFile(vm.file, progressHandler)
                    .then(function(uploadedFile){
                        vm.import.file = uploadedFile;
                        return uploadedFile;
                    })
                    .then(importService.downloadFile)                    
                    .then(function(fileContent){                        
                        vm.eventsToImport = importService.getDataFromFile(fileContent, vm.import.type);
                        return vm.eventsToImport;
                    })
                    .then(importService.checkForDuplicates)
                    .then(function(duplicates){
                        vm.duplicates = duplicates;
                        return duplicates;
                    })
                    .catch(function(error){
                        MessageService.errorMessage('errorMessage.errorUploading');
                    })['finally'](function(){
                        menuHeaderService.decreasePending('processingMessage.uploadingData');
                    });                   
        }
        
        function insertData(){
            menuHeaderService.increasePending('processingMessage.importingData');
            vm.import.dateTime = new Date();
            
            return importService.saveImport(vm.import, false).then(function(){
                return importService.batchRequestProcess(vm.eventsToImport);
            }, function(error){
                MessageService.errorMessage('errorMessage.errorImporting');
            })['finally'](function(){
                menuHeaderService.decreasePending('processingMessage.importingData');
                MessageService.errorMessage('successMessage.successImporting');
                return $state.go('imports');
            });
        }
        
    }
})();
