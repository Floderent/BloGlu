'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('eventController', ['$scope', '$rootScope', '$routeParams', '$q', '$window', '$modal', 'ResourceCode', 'dateUtil', 'UserService', 'MessageService', 'dataService', function Controller($scope, $rootScope, $routeParams, $q, $window, $modal, ResourceCode, dateUtil, UserService, MessageService, dataService) {
        $rootScope.messages = [];
        $rootScope.pending = 0;

        $scope.placeHolder = 100;
        $scope.unitDisabled = true;

        $scope.isEdit = $routeParams && $routeParams.objectId;
        var isPrefilledDateAndTime = $routeParams && $routeParams.day && $routeParams.time;

        var eventType = 'other';
        if ($routeParams.eventType) {
            eventType = $routeParams.eventType;
        }
        $scope.eventCode = ResourceCode[eventType];

        $rootScope.pending++;
        $q.all([
            getEvent(),
            dataService.queryLocal('Unit', {where: {code: $scope.eventCode}}),
            dataService.queryLocal('Category', {where: {code: $scope.eventCode}})
        ]).then(function resolve(results) {
            $rootScope.pending--;
            $scope.event = results[0];
            $scope.units = results[1];
            $scope.categories = results[2];

            handleDate();
            handleCategory();
            handleUnit();

        }, function reject() {
            $rootScope.pending--;
            $rootScope.messages.push(MessageService.errorMessage('Cannot read informations from server', 2000));
        });

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
                $scope.categories.forEach(function(category) {
                    debugger;
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
                $scope.units.forEach(function(unit) {
                    if (unit.objectId === $scope.event.unit.objectId) {
                        $scope.currentUnit = unit;
                    }
                });
            } else {
                if (UserService.currentUser().preferences && UserService.currentUser().preferences.defaultUnit) {
                    $scope.units.forEach(function(unit) {
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
            $rootScope.pending++;
            var deferred = $q.defer();
            if ($scope.isEdit) {
                dataService.queryLocal('Event', {where: {objectId: $routeParams.objectId}}).then(function(result) {
                    $rootScope.pending--;
                    var event = {};
                    if (result && result.length === 1) {
                        event = result[0];
                    }
                    deferred.resolve(event);
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
                    $rootScope.pending--;
                    deferred.resolve({dateTime: newDate});
                } else {
                    $rootScope.pending--;
                    deferred.resolve({});
                }
            }
            return deferred.promise;
        }

        $scope.update = function(event) {
            event.dateTime = $scope.date;
            event.unit = $scope.currentUnit;
            event.category = $scope.currentCategory;
            event.code = $scope.eventCode;
            var savingPromise = null;
            if ($scope.isEdit) {
                savingPromise = dataService.update('Event', event.objectId, event);
            } else {
                savingPromise = dataService.save('Event', event);
            }
            savingPromise.then(function resolve(result) {
                $rootScope.messages.push(MessageService.successMessage('Blood glucose reading saved', 2000));
            }, function reject(error) {
                $rootScope.messages.push(MessageService.errorMessage('Problem saving blood glucose reading', 2000));
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
                    dataService.delete('Event', $scope.event.objectId).then(function(result) {
                        $window.history.back();
                    }, function(error) {
                        $rootScope.messages.push(MessageService.errorMessage("Problem deleting blood glucose reading", 2000));
                    });
                }
            }, function() {
                //exit
            });
        };
        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            //clear messages
            $rootScope.messages = [];
        });
    }]);