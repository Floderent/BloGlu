'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('rangeController', ['$scope', '$rootScope', '$q', '$modal', 'dataService', 'MessageService', 'UserService', 'unitService', function Controller($scope, $rootScope, $q, $modal, dataService, MessageService, UserService, unitService) {
        
        $scope.newRange = {};
        var resourceName = 'Range';
        var eventCode = 1;

        renderPage();

        function renderPage() {
            $rootScope.increasePending("processingMessage.loading");
            $q.all([
                dataService.queryLocal(resourceName),
                unitService.getUnitsByCode(eventCode)
            ]).then(function(results) {
                $scope.ranges = results[0];
                $scope.units = results[1];
                handleNewRangeUnit();
                processRanges($scope.ranges);
                $scope.$watch('ranges', function(newValue, oldValue) {
                    processRanges($scope.ranges);
                    //checkRanges($scope.ranges);
                }, true);                
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
            })['finally'](function(){
                $rootScope.decreasePending("processingMessage.loading");
            });

        }


        function handleNewRangeUnit() {
            if ($scope.newRange.unit) {
                angular.forEach($scope.units, function(unit) {
                    if (unit.objectId === $scope.newRange.unit.objectId) {
                        $scope.newRangeUnit = unit;
                    }
                });
            } else {
                if (UserService.currentUser().preferences && UserService.currentUser().preferences.defaultUnit) {
                    angular.forEach($scope.units, function(unit) {
                        if (unit.objectId === UserService.currentUser().preferences.defaultUnit.objectId) {
                            $scope.newRangeUnit = unit;
                            return;
                        }
                    });
                }
                if (!$scope.newRange.unit && $scope.units.length > 0) {
                    $scope.newRangeUnit = $scope.units[0];
                }
            }
            $scope.$watch('newRangeUnit', function(newValue, oldValue) {
                if (newValue && oldValue) {
                    if ($scope.newRange && $scope.newRange.lowerLimit) {
                        $scope.newRange.lowerLimit = $scope.newRange.lowerLimit * oldValue.coefficient / newValue.coefficient;
                    }
                    if ($scope.newRange && $scope.newRange.upperLimit) {
                        $scope.newRange.upperLimit = $scope.newRange.upperLimit * oldValue.coefficient / newValue.coefficient;
                    }
                }
            });
        }


        function processRanges(rangeArray) {
            $scope.newRange = getNewRange(rangeArray);
        }


        function getNewRange(rangeArray) {
            var maxUpperLimit = 0;
            angular.forEach(rangeArray, function(range) {
                if (range.upperLimit > maxUpperLimit) {
                    maxUpperLimit = range.upperLimit;
                }
            });
            var newRange = {
                unit: $scope.newRangeUnit,
                lowerLimit: maxUpperLimit,
                upperLimit: maxUpperLimit,
                normal: false,
                color: ''
            };
            return newRange;
        }


        function checkRanges(existingRanges, newRange) {
            var rangeValid = true;
            return rangeValid;
        }

        $scope.getLowerLimit = function(range) {
            return range.lowerLimit;
        };


        $scope.saveRange = function(range) {
            if (range && range.lowerLimit !== null && range.upperLimit !== null) {                
                if (checkRanges($scope.ranges, range)) {
                    $rootScope.increasePending("processingMessage.savingData");
                    dataService.save(resourceName, {
                        unit: range.unit,
                        lowerLimit: range.lowerLimit,
                        upperLimit: range.upperLimit,
                        normal: range.normal,
                        color: range.color
                    }).then(function(result) {
                        angular.extend(range, result);
                        $scope.ranges.push(range);
                        processRanges($scope.ranges);
                        $rootScope.messages.push(MessageService.successMessage("successMessage.rangeCreated", 2000));                        
                    }, function(error) {                        
                        $rootScope.messages.push(MessageService.errorMessage("errorMessage.creatingError", 2000));
                    })['finally'](function(){
                        $rootScope.decreasePending("processingMessage.savingData");
                    });
                }
            }
        };
        
        $scope.updateRange = function(range) {
            if (!checkRanges($scope.ranges)) {
                $scope.cancelEditPeriod(range);
            } else {
                if (range.objectId) {
                    $rootScope.increasePending("processingMessage.updatingData");
                    dataService.update(resourceName, range.objectId, {
                        unit: range.unit,
                        lowerLimit: range.lowerLimit,
                        upperLimit: range.upperLimit,
                        normal: range.normal,
                        color: range.color
                    }).then(function(result) {
                        range.isEdit = false;
                        processRanges($scope.ranges);
                        $rootScope.messages.push(MessageService.successMessage("successMessage.rangeUpdated", 2000));
                    }, function(error) {
                        $scope.cancelEditRange(range);
                        $rootScope.messages.push(MessageService.errorMessage("errorMessage.updatingError", 2000));
                    })['finally'](function(){
                        $rootScope.increasePending("processingMessage.updatingData");
                    });
                }
            }
        };


        $scope.deleteRange = function(range) {            
            var modalInstance = $modal.open({
                templateUrl: "views/modal/confirm.html",
                controller: "confirmModalController",                
                resolve: {
                    confirmed: function() {
                        return $scope.confirmed;
                    }
                }
            });
            modalInstance.result.then(function(confirmed) {
                if (confirmed) {
                    if (range.objectId) {
                        $rootScope.increasePending("processingMessage.deletingData");
                        dataService.delete(resourceName, range.objectId).then(function(result) {
                            var rangeIndex = -1;
                            angular.forEach($scope.periods, function(rg, index) {
                                if (rg.objectId && rg.objectId === range.objectId) {
                                    rangeIndex = index;
                                }
                            });
                            if (rangeIndex !== -1) {
                                $scope.ranges.splice(rangeIndex, 1);
                            }
                            processRanges($scope.ranges);                            
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


        $scope.editRange = function(range) {
            range.isEdit = true;
            range.original = angular.extend({}, range);
        };

        $scope.cancelEditRange = function(range) {
            range.isEdit = false;
            range.unit = range.original.unit;
            range.lowerLimit = range.original.lowerLimit;
            range.upperLimit = range.original.upperLimit;
            range.normal = range.original.normal;
            range.color = range.original.color;
            delete range.original;
        };

        

        $rootScope.$on('dataReady', renderPage);        
    }]);


