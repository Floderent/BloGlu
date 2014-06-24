'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('periodController', ['$rootScope', '$scope', '$modal', 'MessageService', 'periodService', function Controller($rootScope, $scope, $modal, MessageService, periodService) {
        
        $scope.arePeriodsOnMoreThanOneDay = true;

        renderPage();

        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            periodService.getPeriods().then(function(result) {
                $scope.periods = result;
                processPeriods($scope.periods);
                $scope.$watch('periods', function(newValue, oldValue) {
                    processPeriods($scope.periods);
                    checkPeriods($scope.periods);
                }, true);                
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
            })['finally'](function(){
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }

        function processPeriods(periodArray) {
            $scope.arePeriodsOnMoreThanOneDay = periodService.arePeriodsOnMoreThanOneDay(periodArray);            
            $scope.newPeriod = periodService.getNewPeriod(periodArray);
        }

        function checkPeriods(existingPeriods, newPeriod) {
            var errorMessages = periodService.checkPeriods(existingPeriods, newPeriod);
            angular.forEach(errorMessages, function(errorMessage) {
                $rootScope.messages.push(MessageService.errorMessage(errorMessage, 2000));
            });
            return errorMessages.length === 0;
        }

        $scope.getBeginDateHours = function(period) {
            var beginDateHours = period.begin.getHours();
            var beginDateMinutes = period.begin.getMinutes();
            return beginDateHours * 60 + beginDateMinutes;
        };

        $scope.savePeriod = function(period) {
            if (period && period.begin && period.end) {                
                if (checkPeriods($scope.periods, period)) {
                    $rootScope.increasePending("processingMessage.savingData");
                    periodService.savePeriod(period).then(function(result) {
                        angular.extend(period, result);
                        $scope.periods.push(period);
                        processPeriods($scope.periods);
                        $rootScope.messages.push(MessageService.successMessage("successMessage.periodCreated", 2000));
                    }, function(error) {
                        $rootScope.messages.push(MessageService.errorMessage("errorMessage.creatingError", 2000));
                    })['finally'](function(){
                        $rootScope.decreasePending("processingMessage.savingData");
                    });
                }
            }
        };

        $scope.updatePeriod = function(period) {
            if (!checkPeriods($scope.periods)) {
                $scope.cancelEditPeriod(period);
            } else {
                if (period.objectId) {
                    $rootScope.increasePending("processingMessage.updatingData");
                    periodService.savePeriod(period, true).then(function(result) {
                        period.isEdit = false;
                        processPeriods($scope.periods);
                        $rootScope.messages.push(MessageService.successMessage("successMessage.periodUpdated", 2000));
                    }, function(error) {
                        $scope.cancelEditPeriod(period);
                        $rootScope.messages.push(MessageService.errorMessage("errorMessage.updatingError", 2000));
                    })['finally'](function(){
                        $rootScope.decreasePending("processingMessage.updatingData");
                    });

                }
            }
        };


        $scope.deletePeriod = function(period) {
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = period.name;            
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
                        $rootScope.increasePending("processingMessage.deletingData");
                        periodService.deletePeriod(period).then(function(result) {
                            var periodIndex = -1;
                            angular.forEach($scope.periods, function(per, index) {
                                if (per.objectId && per.objectId === period.objectId) {
                                    periodIndex = index;
                                }
                            });
                            if (periodIndex !== -1) {
                                $scope.periods.splice(periodIndex, 1);
                            }
                            processPeriods($scope.periods);                            
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

        $rootScope.$on('dataReady', renderPage);
    }]);


