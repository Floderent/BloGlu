'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller("importController", ["$scope", "importService", function Controller($scope, importService) {
        $scope.onFileSelect = function($files) {
            if (Array.isArray($files) && $files.length > 0) {
                importService.uploadFile($files[0]).then(function resolve(result) {
                    if (result && result.data && result.data.url) {
                        importService.downloadFile(result.data.url).then(function resolve(result) {
                            importService.processFile(result.data);
                        }, function reject() {
                            debugger;
                        });
                    }
                }, function reject(error) {
                    debugger;
                }, function progress(evt) {
                    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                });
            }
        };
    }]);