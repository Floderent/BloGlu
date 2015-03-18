(function () {
    'use strict';

    angular.module('bloglu.import')
            .controller('importListController', importListController);

    importListController.$inject = ['$rootScope', 'importService', 'MessageService', 'Utils'];

    function importListController($rootScope, importService, MessageService, Utils) {
        
        var vm = this;
        
        vm.deleteImport = deleteImport;
        vm.imports = [];
        
        renderPage();

        function renderPage() {
            $rootScope.increasePending('processingMessage.loadingData');
            importService.getImports().then(function (imports) {
                vm.imports = imports;
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage('errorMessage.loadingError', 2000));
            })['finally'](function () {
                $rootScope.decreasePending('processingMessage.loadingData');
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
                        $rootScope.increasePending("processingMessage.deletingData");
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
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                        })['finally'](function () {
                            $rootScope.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function () {
                //exit
            });
        };

        $rootScope.$on('dataReady', renderPage);
    }
})();