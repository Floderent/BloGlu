'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('eventController',
        [
            '$scope',
            '$rootScope',
            '$routeParams',
            '$q',
            '$window',            
            'ResourceCode',
            'UserService',
            'MessageService',
            'categoryService',
            'unitService',
            'eventService',
            'Utils',
            function Controller(
                    $scope,
                    $rootScope,
                    $routeParams,
                    $q,
                    $window,                    
                    ResourceCode,
                    UserService,
                    MessageService,
                    categoryService,
                    unitService,
                    eventService,
                    Utils) {

                initParams();
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
                        handleUnit();

                    }, function reject() {
                        $rootScope.messages.push(MessageService.errorMessage('errorMessage.loadingError', 2000));
                    })['finally'](function () {
                        $rootScope.decreasePending('processingMessage.synchronizing');
                    });
                }


                function initParams() {
                    $scope.placeHolder = 100;
                    $scope.unitDisabled = true;
                
                    //init routeParams
                    $scope.objectId = $scope.objectId || $routeParams.objectId;
                    $scope.day = $scope.day || $routeParams.day;
                    $scope.time = $scope.time || $routeParams.time;

                    $scope.isEdit = $scope.objectId;
                    $scope.isPrefilledDateAndTime = $scope.day && $scope.time;

                    var eventType = $scope.eventType || $routeParams.eventType || 'other';

                    $scope.eventCode = ResourceCode[eventType];
                }

                function handleDate() {
                    //=====handle date
                    var currentDate = new Date();
                    if ($scope.event.dateTime) {
                        currentDate = $scope.event.dateTime;
                    }
                    $scope.date = currentDate;
                }



                function handleUnit() {
                    //=====handle units
                    if (!$scope.event.unit) {
                        if (UserService.currentUser().preferences && UserService.currentUser().preferences.defaultUnit) {
                            $scope.event.unit = UserService.currentUser().preferences.defaultUnit;
                        } else {
                            if ($scope.units.length > 0) {
                                $scope.event.unit = $scope.units[0];
                            }
                        }
                    }
                    $scope.$watch('event.unit', function (newValue, oldValue) {
                        if (newValue && oldValue && newValue !== oldValue) {
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
                        eventService.getEvent($scope.objectId).then(function (result) {
                            deferred.resolve(result);
                        }, function (error) {
                            $scope.isEdit = false;
                            deferred.reject(error);
                        });
                    } else {
                        if ($scope.isPrefilledDateAndTime) {
                            var rgbDate = new Date($scope.day);
                            var rgbTime = new Date($scope.time);

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

                $scope.open = function ($event) {
                    $event.preventDefault();
                    $event.stopPropagation();
                    $scope.opened = true;
                };

                $scope.update = function (event) {
                    if ($scope.isEdit) {
                        $rootScope.increasePending("processingMessage.updatingData");
                    } else {
                        $rootScope.increasePending("processingMessage.savingData");
                    }
                    event.dateTime = $scope.date;
                    event.code = $scope.eventCode;
                    eventService.saveEvent(event, $scope.isEdit).then(function resolve(result) {
                        if ($scope.isEdit) {
                            $rootScope.messages.push(MessageService.successMessage(eventService.resolveUpdateMessage($scope.eventCode), 2000));
                        } else {
                            $rootScope.messages.push(MessageService.successMessage(eventService.resolveCreationMessage($scope.eventCode), 2000));
                        }
                        $window.history.back();
                    }, function reject(error) {
                        if ($scope.isEdit) {
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.updatingError', 2000));
                        } else {
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.creatingError', 2000));
                        }
                    })['finally'](function () {
                        if ($scope.isEdit) {
                            $rootScope.decreasePending("processingMessage.updatingData");
                        } else {
                            $rootScope.decreasePending("processingMessage.savingData");
                        }
                    });

                };

                $scope.delete = function () {                    
                    var modalScope = {
                        confirmTitle:'confirm.pageTitle',
                        confirmMessage:'confirm.deletionMessage',
                        confirmYes:'confirm.yes',
                        confirmNo:'confirm.no'
                    };
                    Utils.openConfirmModal(modalScope).then(function (confirmed) {
                        if (confirmed) {
                            $rootScope.increasePending("processingMessage.deletingData");
                            eventService.deleteEvent($scope.event.objectId).then(function (result) {
                                $window.history.back();
                            }, function (error) {
                                $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                            })['finally'](function () {
                                $rootScope.decreasePending("processingMessage.deletingData");
                            });
                        }
                    }, function () {
                        //exit
                    });
                };
                $rootScope.$on('dataReady', renderPage);
            }]);