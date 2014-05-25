'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('periodController', ['$rootScope', '$scope', '$modal', 'dateUtil', 'MessageService', 'dataService', function Controller($rootScope, $scope, $modal, dateUtil, MessageService, dataService) {
        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.arePeriodsOnMoreThanOneDay = true;
        $rootScope.pending++;
        var resourceName = 'Period';
        
        dataService.queryLocal(resourceName).then(function(result) {
            $scope.periods = result;
            processPeriods($scope.periods);
            $scope.$watch('periods', function(newValue, oldValue) {
                processPeriods($scope.periods);
                checkPeriods($scope.periods);
            }, true);
            $rootScope.pending--;
        }, function(error) {
            $rootScope.messages.push(MessageService.errorMessage("Error loading periods.", 2000));
            $rootScope.pending--;
        });


        function processPeriods(periodArray) {
            $scope.arePeriodsOnMoreThanOneDay = (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) >= 1);
            if (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) === 0) {
                var newPeriod = getNewPeriod(periodArray);
                $scope.newPeriod = newPeriod;
            }
        }

        function getNewPeriod(periodArray) {
            var maxEndDate = dateUtil.getPeriodMaxEndDate(periodArray);
            if (maxEndDate === null) {
                maxEndDate = new Date();
                maxEndDate.setHours(0);
                maxEndDate.setMinutes(0);
                maxEndDate.setSeconds(0);
                maxEndDate.setMilliseconds(0);
            }
            var endDate = new Date(maxEndDate.getTime());
            endDate.setDate(maxEndDate.getDate() + 1);
            endDate.setHours(0);
            endDate.setMinutes(0);
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);
            var newPeriod = {
                name: '',
                begin: maxEndDate,
                end: endDate
            };
            return newPeriod;
        }

        function checkPeriods(existingPeriods, newPeriod) {
            var periodValid = true;
            var periodArray = $scope.periods.slice();
            if (newPeriod && newPeriod.begin && newPeriod.end) {
                periodArray.push(newPeriod);
                $scope.errorMessage = "";
                if (newPeriod.end.getHours() !== 0 && newPeriod.end.getMinutes() !== 0) {
                    if (newPeriod.begin > newPeriod.end) {
                        $rootScope.messages.push(MessageService.errorMessage("Period begining must be inferior to period end.", 2000));
                        periodValid = false;
                    }
                }
            }
            if (dateUtil.arePeriodsIntersecting(periodArray)) {
                $rootScope.messages.push(MessageService.errorMessage("The period is intersecting with another.", 2000));
                periodValid = false;
            }
            return periodValid;
        }
        
        $scope.getBeginDateHours = function(period){
            var beginDateHours = period.begin.getHours();
            var beginDateMinutes = period.begin.getMinutes();
            return beginDateHours * 60 + beginDateMinutes;
        };
        

        $scope.savePeriod = function(period) {
            if (period && period.begin && period.end) {
                //check periods => length, intersection
                if (checkPeriods($scope.periods, period)) {
                    $rootScope.pending++;
                    dataService.save(resourceName, {
                        name: period.name,
                        begin: period.begin,
                        end: period.end
                    }).then(function(result) {
                        angular.extend(period, result);
                        $scope.periods.push(period);
                        processPeriods($scope.periods);
                        //initNewPeriod();
                        $rootScope.messages.push(MessageService.successMessage("Period created.", 2000));
                        $rootScope.pending--;
                    }, function(error) {
                        debugger;
                        $rootScope.messages.push(MessageService.errorMessage("Error creating period.", 2000));
                        $rootScope.pending--;
                    });
                }
            }
        };

        $scope.deletePeriod = function(period) {
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = "the " + period.name + " period";
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
                    if (period.objectId) {
                        $rootScope.pending++;
                        dataService.delete(resourceName, period.objectId).then(function(result) {
                            var periodIndex = -1;
                            $scope.periods.forEach(function(per, index) {
                                if (per.objectId && per.objectId === period.objectId) {
                                    periodIndex = index;
                                }
                            });
                            if (periodIndex !== -1) {
                                $scope.periods.splice(periodIndex, 1);
                            }
                            processPeriods($scope.periods);
                            $rootScope.pending--;
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('Problem deleting period', 2000));
                            $rootScope.pending--;
                        });
                    }
                }
            }, function() {
                //exit
            });

        };


        $scope.editPeriod = function(period) {
            period.isEdit = true;
            period.original = angular.extend({}, period);
        };

        $scope.cancelEditPeriod = function(period) {
            period.isEdit = false;
            period.begin = period.original.begin;
            period.end = period.original.end;
            period.name = period.original.name;
            delete period.original;
        };

        $scope.updatePeriod = function(period) {
            if (!checkPeriods($scope.periods)) {
                $scope.cancelEditPeriod(period);
            } else {
                if (period.objectId) {
                    $rootScope.pending++;
                    dataService.update(resourceName, period.objectId, {
                        name: period.name,
                        begin: period.begin,
                        end: period.end
                    }).then(function(result) {
                        period.isEdit = false;
                        processPeriods($scope.periods);
                        $rootScope.pending--;
                    }, function(error) {
                        $scope.cancelEditPeriod(period);
                        $rootScope.pending--;
                    });

                }
            }
        };

        $scope.$on('$routeChangeStart', function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            $rootScope.pending = 0;
            //clear messages
            $rootScope.messages = [];
        });


    }]);


