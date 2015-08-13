(function () {
    'use strict';

    angular.module('bloglu.import')
            .controller('importListController', importListController);

    importListController.$inject = ['menuHeaderService', '$state','$scope', 'importService', 'MessageService', 'Utils'];

    function importListController(menuHeaderService, $state, $scope, importService, MessageService, Utils) {
        
        var vm = this;
        
        vm.deleteImport = deleteImport;
        vm.imports = [];
        vm.goToNewimport = goToNewimport;
        
        renderPage();

        function renderPage() {
            menuHeaderService.increasePending('processingMessage.loadingData');
            importService.getImports().then(function (imports) {
                vm.imports = imports;
            }, function (error) {
                MessageService.errorMessage('errorMessage.loadingError', 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending('processingMessage.loadingData');
            });
        }

        function deleteImport(impor) {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: {id: 'confirm.deletionMessageWithName', params: {objectName: impor.name}},
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    if (impor.objectId) {
                        menuHeaderService.increasePending("processingMessage.deletingData");
                        importService.deleteImport(impor).then(function (result) {
                            var importIndex = -1;
                            angular.forEach(vm.imports, function (imp, index) {
                                if (imp.objectId && imp.objectId === impor.objectId) {
                                    importIndex = index;
                                }
                            });
                            if (importIndex !== -1) {
                                vm.imports.splice(importIndex, 1);
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
        
        function goToNewimport(){
            $state.go('import');
        }
        
        

        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();