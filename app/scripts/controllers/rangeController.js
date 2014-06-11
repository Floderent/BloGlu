'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('rangeController', ['$scope', '$rootScope', '$q', '$routeParams', '$modal', '$window', 'dataService', 'MessageService', 'UserService', function Controller($scope, $rootScope, $q, $routeParams, $modal, $window, dataService, MessageService, UserService) {

        $rootScope.messages = [];
        $rootScope.pending = 0;

        $scope.newRange = {};
        var resourceName = 'Range';
        var eventCode = 1;

        renderPage();

        function renderPage() {
            $rootScope.pending++;

            $q.all([
                dataService.queryLocal(resourceName),
                dataService.queryLocal('Unit', {where: {code: eventCode}})
            ]).then(function(results) {
                $scope.ranges = results[0];
                $scope.units = results[1];

                handleNewRangeUnit();

                processRanges($scope.ranges);
                $scope.$watch('ranges', function(newValue, oldValue) {
                    processRanges($scope.ranges);
                    //checkRanges($scope.ranges);
                }, true);
                $rootScope.pending--;
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage("Error loading periods.", 2000));
                $rootScope.pending--;
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
                //check periods => length, intersection
                if (checkRanges($scope.ranges, range)) {
                    $rootScope.pending++;
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
                        $rootScope.messages.push(MessageService.successMessage("Range created.", 2000));
                        $rootScope.pending--;
                    }, function(error) {
                        debugger;
                        $rootScope.messages.push(MessageService.errorMessage("Error creating range.", 2000));
                        $rootScope.pending--;
                    });
                }
            }
        };



        $scope.deleteRange = function(range) {
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = "the range";
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
                    if (range.objectId) {
                        $rootScope.pending++;
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
                            $rootScope.pending--;
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('Problem deleting range', 2000));
                            $rootScope.pending--;
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

        $scope.updateRange = function(range) {
            if (!checkRanges($scope.ranges)) {
                $scope.cancelEditPeriod(range);
            } else {
                if (range.objectId) {
                    $rootScope.pending++;
                    dataService.update(resourceName, range.objectId, {
                        unit: range.unit,
                        lowerLimit: range.lowerLimit,
                        upperLimit: range.upperLimit,
                        normal: range.normal,
                        color: range.color
                    }).then(function(result) {
                        range.isEdit = false;
                        processRanges($scope.ranges);
                        $rootScope.pending--;
                    }, function(error) {
                        $scope.cancelEditRange(range);
                        $rootScope.pending--;
                    });
                }
            }
        };




        $window.addEventListener('dataReady', renderPage);

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            //clear messages
            //clear events
            $window.removeEventListener('dataReady', renderPage);
        });
    }]);


