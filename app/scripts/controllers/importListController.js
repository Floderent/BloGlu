'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('importListController', ['$scope', '$rootScope', '$q', '$window','$location','$modal', 'importService', 'MessageService', function Controller($scope, $rootScope, $q, $window,$location, $modal, importService, MessageService) {

        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.imports = [];

        renderPage();

        function renderPage() {
            $rootScope.pending++;
            importService.getImports().then(function(imports) {
                $scope.imports = imports;
                $rootScope.pending--;
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage('Cannot get the imports', 2000));
                $rootScope.pending--;
            });
        }

        $scope.deleteImport = function(impor) {            
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = "the " + impor.name + " import";
            var modalInstance = $modal.open({
                templateUrl: "views/modal/confirm.html",
                controller: "confirmModalController",
                scope: $modalScope,
                resolve: {
                    confirmed: function() {
                        return $scope.confirmed;
                    }
                }
            });
            modalInstance.result.then(function(confirmed) {
                if (confirmed) {
                    if (impor.objectId) {
                        $rootScope.pending++;                        
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
                            $rootScope.pending--;
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('Problem deleting import', 2000));
                            $rootScope.pending--;
                        });
                    }
                }
            }, function() {
                //exit
            });
        };
        /*
        $scope.editReport = function(report) {
            var path = 'report/' + report.objectId;            
            $location.path(path);
        };
        */
       
       
       
        $window.addEventListener('dataReady', renderPage);

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            $rootScope.pending = 0;
            //clear messages
            $rootScope.messages = [];
            //clear events
            $window.removeEventListener('dataReady', renderPage);
        });



    }]);
