'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('importController', ['$rootScope', '$scope', '$window', 'importService', 'MessageService', function Controller($rootScope, $scope, $window, importService, MessageService) {

        $scope.file = null;
        $scope.import = {};


        $scope.onFileSelect = function(files) {
            if (Array.isArray(files) && files.length > 0) {                
                $scope.file = files[0];
            }
        };

        $scope.importData = function() {            
            $rootScope.pending++;            
            $scope.import.dateTime = new Date();
            importService.importData($scope.import, $scope.file).then(function(importResult) {                
                importService.saveImport(importResult.import,true).then(function(saveResult){                    
                    $rootScope.pending--;
                },function(error){
                    $rootScope.pending--;
                });
                
                
            }, function(error) {
                $rootScope.pending--;
            });

        };


        function renderPage() {
        }


        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            //clear messages
            $rootScope.messages = [];
            //clear events
            $window.removeEventListener('dataReady', renderPage);
        });


    }]);