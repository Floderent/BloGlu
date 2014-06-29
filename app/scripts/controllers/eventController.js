'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('eventController',
        [
            '$scope',
            '$rootScope',
            '$routeParams',
            '$q',
            '$window',
            '$modal',
            'ResourceCode',
            'UserService',
            'MessageService',
            'categoryService',
            'unitService',
            'eventService',
            function Controller(
                    $scope,
                    $rootScope,
                    $routeParams,
                    $q,
                    $window,
                    $modal,
                    ResourceCode,
                    UserService,
                    MessageService,
                    categoryService,
                    unitService,
                    eventService) {

                $scope.placeHolder = 100;
                $scope.unitDisabled = true;

                $scope.isEdit = $routeParams && $routeParams.objectId;
                var isPrefilledDateAndTime = $routeParams && $routeParams.day && $routeParams.time;

                var eventType = 'other';
                if ($routeParams.eventType) {
                    eventType = $routeParams.eventType;
                }
                $scope.eventCode = ResourceCode[eventType];
                renderPage();

                function renderPage() {
                    $rootScope.increasePending('processingMessage.synchronizing');
                    $q.all([
                        getEvent(),
                        unitService.getUnitsByCode($scope.eventCode),
                        categoryService.getCategoriesByCode($scope.eventCode)
                    ]).then(function resolve(results) {
                        $scope.event = results[0];
                        $scope.units = results[1];
                        $scope.categories = results[2];

                        handleDate();
                        handleCategory();
                        handleUnit();

                    }, function reject() {
                        $rootScope.messages.push(MessageService.errorMessage('errorMessage.loadingError', 2000));
                    })['finally'](function() {
                        $rootScope.decreasePending('processingMessage.synchronizing');
                    });
                }

                $scope.open = function($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.opened = true;
                };


                function handleDate() {
                    //=====handle date
                    var currentDate = new Date();
                    if ($scope.event.dateTime) {
                        currentDate = $scope.event.dateTime;
                    }
                    $scope.date = currentDate;
                }

                function handleCategory() {
                    //=====handle category
                    var currentCategory = null;
                    if ($scope.event.category) {
                        angular.forEach($scope.categories, function(category) {
                            if (category.objectId === $scope.event.category.objectId) {
                                currentCategory = category;
                                return;
                            }
                        });
                    }
                    $scope.currentCategory = currentCategory;
                }

                function handleUnit() {
                    //=====handle units
                    if ($scope.event.unit) {
                        angular.forEach($scope.units, function(unit) {
                            if (unit.objectId === $scope.event.unit.objectId) {
                                $scope.currentUnit = unit;
                            }
                        });
                    } else {
                        if (UserService.currentUser().preferences && UserService.currentUser().preferences.defaultUnit) {
                            angular.forEach($scope.units, function(unit) {
                                if (unit.objectId === UserService.currentUser().preferences.defaultUnit.objectId) {
                                    $scope.currentUnit = unit;
                                    return;
                                }
                            });
                        }
                        if (!$scope.currentUnit && $scope.units.length > 0) {
                            $scope.currentUnit = $scope.units[0];
                        }
                    }
                    $scope.$watch('currentUnit', function(newValue, oldValue) {
                        if (newValue && oldValue) {
                            if ($scope.event && $scope.event.reading) {
                                $scope.event.reading = $scope.event.reading * oldValue.coefficient / newValue.coefficient;
                            } else {
                                $scope.placeHolder = $scope.placeHolder * oldValue.coefficient / newValue.coefficient;
                            }
                        }
                    });
                }


                function getEvent() {
                    var deferred = $q.defer();
                    if ($scope.isEdit) {
                        eventService.getEvent($routeParams.objectId).then(function(result) {
                            deferred.resolve(result);
                        }, function(error) {
                            $scope.isEdit = false;
                            deferred.reject(error);
                        });

                    } else {
                        if (isPrefilledDateAndTime) {
                            var rgbDate = new Date($routeParams.day);
                            var rgbTime = new Date($routeParams.time);

                            var newDate = new Date();
                            newDate.setFullYear(rgbDate.getFullYear());
                            newDate.setMonth(rgbDate.getMonth());
                            newDate.setDate(rgbDate.getDate());

                            newDate.setHours(rgbTime.getHours());
                            newDate.setMinutes(rgbTime.getMinutes());
                            newDate.setSeconds(0);
                            newDate.setMilliseconds(0);
                            deferred.resolve({dateTime: newDate});
                        } else {
                            deferred.resolve({});
                        }
                    }
                    return deferred.promise;
                }

                $scope.update = function(event) {
                    if ($scope.isEdit) {
                        $rootScope.increasePending("processingMessage.updatingData");
                    }else{
                        $rootScope.increasePending("processingMessage.savingData");
                    }
                    event.dateTime = $scope.date;
                    event.unit = $scope.currentUnit;
                    event.category = $scope.currentCategory;
                    event.code = $scope.eventCode;
                    eventService.saveEvent(event, $scope.isEdit).then(function resolve(result) {
                        if($scope.isEdit){                            
                            $rootScope.messages.push(MessageService.successMessage(eventService.resolveUpdateMessage($scope.eventCode), 2000));
                        }else{
                            $rootScope.messages.push(MessageService.successMessage(eventService.resolveCreationMessage($scope.eventCode), 2000));
                        }
                        $window.history.back();
                    }, function reject(error) {
                        if($scope.isEdit){
                            $rootScope.messages.push(MessageService.successMessage('errorMessage.updatingError', 2000));
                        }else{
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.creatingError', 2000));
                        }                           
                    })['finally'](function() {
                        if ($scope.isEdit) {
                            $rootScope.decreasePending("processingMessage.updatingData");
                        }else{
                            $rootScope.decreasePending("processingMessage.savingData");
                        }
                    });

                };

                $scope.delete = function() {                    
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
                            $rootScope.increasePending("processingMessage.deletingData");
                            eventService.deleteEvent($scope.event.objectId).then(function(result) {
                                $window.history.back();
                            }, function(error) {
                                $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                            })['finally'](function(){
                                $rootScope.decreasePending("processingMessage.deletingData");
                            });
                        }
                    }, function() {
                        //exit
                    });
                };

                $rootScope.$on('dataReady', renderPage);

            }]);