'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('importListController', ['$scope', '$rootScope', 'importService', 'MessageService','Utils', function Controller($scope, $rootScope, importService, MessageService, Utils) {
        
        renderPage();

        function renderPage() {
            $rootScope.increasePending('processingMessage.loadingData');
            importService.getImports().then(function(imports) {
                $scope.imports = imports;                
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage('errorMessage.loadingError', 2000));
            })['finally'](function(){
                $rootScope.decreasePending('processingMessage.loadingData');
            });
        }

        $scope.deleteImport = function(impor) {
            var modalScope = {
                       confirmTitle:'confirm.pageTitle',
                       confirmMessage:'confirm.deletionMessage',
                       confirmYes:'confirm.yes',
                       confirmNo:'confirm.no',
                       message: impor.name
                   };           
            Utils.openConfirmModal(modalScope).then(function(confirmed) {
                if (confirmed) {
                    if (impor.objectId) {
                        $rootScope.increasePending("processingMessage.deletingData");
                        importService.deleteImport(impor).then(function(result) {
                            var importIndex = -1;
                            angular.forEach($scope.imports, function(imp, index) {
                                if (imp.objectId && imp.objectId === impor.objectId) {
                                    importIndex = index;
                                }
                            });
                            if (importIndex !== -1) {
                                $scope.imports.splice(importIndex, 1);
                            }                            
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                        })['finally'](function(){
                            $rootScope.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function() {
                //exit
            });
        };               
       
        $rootScope.$on('dataReady', renderPage);
    }]);
