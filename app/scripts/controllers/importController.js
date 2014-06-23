'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('importController', ['$rootScope', '$scope', 'importService', 'MessageService', function Controller($rootScope, $scope, importService, MessageService) {

        $scope.file = null;
        $scope.import = {};
        
        $scope.onFileSelect = function(files) {
            if (Array.isArray(files) && files.length > 0) {                
                $scope.file = files[0];
            }
        };

        $scope.importData = function() {            
            $rootScope.increasePending('processingMessage.importingData');
            $scope.import.dateTime = new Date();
            importService.importData($scope.import, $scope.file).then(function(importResult) {                
                importService.saveImport(importResult.import,true).then(function(saveResult){                    
                    MessageService.successMessage('successMessage.dataImported',2000);
                },function(error){
                    MessageService.errorMessage('errorMessage.errorCreating',2000);
                });
            }, function(error) {
                MessageService.errorMessage('errorMessage.errorImporting',2000);
            }).finally(function(){
                $rootScope.decreasePending('processingMessage.importingData');
            });
        };
    }]);