'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('overviewController', ['$scope', '$rootScope', '$location', '$routeParams', '$filter', '$window', '$modal', 'ResourceName', 'ResourceCode', 'overViewService', 'MessageService', 'printService', function Controller($scope, $rootScope, $location, $routeParams, $filter, $window, $modal, ResourceName, ResourceCode, overViewService, MessageService, printService) {

        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.data = [];

        $scope.eventsTypes = ResourceName;
        $scope.display = [1];

        //default display blood glucose
        $scope.resource = {1: true};


        var currentDate = null;
        $scope.interval = 'week';

        if ($routeParams && $routeParams.weekDate) {
            currentDate = new Date($routeParams.weekDate);
        } else {
            currentDate = new Date();
        }
        if ($routeParams && $routeParams.interval) {
            $scope.interval = $routeParams.interval;
        }
        if ($routeParams && $routeParams.display) {
            $scope.display = $routeParams.display;
        }

        if ($routeParams && $routeParams.display) {
            var intStrArray = $routeParams.display.split(',');
            var intArray = [];
            var resource = {};
            angular.forEach(intStrArray, function(value, key) {
                intArray.push(parseInt(value));
                resource[key] = true;
            });
            $scope.resource = resource;
            $scope.display = intArray;
        }

        $scope.$watch('resource', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                var resourceCodes = [];
                angular.forEach(newValue, function(value, key) {
                    if (value) {
                        resourceCodes.push(parseInt(key));
                    }
                });
                $scope.display = resourceCodes;
                renderPage();
            }
        }, true);

        function getEventTypes() {
            var eventTypes = {};
            angular.forEach($scope.display, function(value, key) {
                eventTypes[value] = ResourceName[value];
            });
            return eventTypes;
        }

        function getDisplayParam(array) {
            var result = '';
            angular.forEach(array, function(value, key) {
                result += value;
                if (key !== array.length - 1) {
                    result += ',';
                }
            });
            return result;
        }


        $scope.timeInterval = overViewService.getTimeInterval($scope.interval, currentDate);

        renderPage();

        function renderPage() {
            $rootScope.pending++;
            var params = {where: {code: {$in: $scope.display}}};
            overViewService.getTableData($scope.timeInterval, params).then(
                    function resolve(result) {
                        $rootScope.pending--;
                        $scope.header = result[0];
                        $scope.data = result;
                    },
                    function reject(error) {
                        $rootScope.pending--;
                        $scope.header = [];
                        $scope.data = [];
                    });
        }


        $scope.printToPDF = function() {
            printService.convertTableToPDF($scope.data, renderCell.bind({
                interval: $scope.interval
            }));
        };

        function renderCell(rowIndex, columnIndex, cellData, tableData) {
            var valueToDisplay = "";
            if (cellData) {
                if (rowIndex === 0) {
                    if (cellData.name) {
                        valueToDisplay = cellData.name;
                    }
                } else {
                    if (columnIndex === 0) {
                        if (this.interval === 'week') {
                            valueToDisplay = $filter('date')(cellData.date, 'EEEE d MMM');
                        } else {
                            if (cellData.text) {
                                valueToDisplay = cellData.text;
                            }
                        }
                    } else {
                        if (this.interval === 'week') {
                            if (cellData && Array.isArray(cellData)) {
                                angular.forEach(cellData, function(element) {
                                    valueToDisplay += $filter('date')(element.dateTime, 'HH:mm') + " " + element.reading + " ";
                                });
                            }
                        } else {
                            if (cellData && Array.isArray(cellData)) {
                                angular.forEach(cellData, function(element) {
                                    valueToDisplay = "Maximum: " + element.maximum + " / Minimum: " + element.minimum + " / Average: " + element.average + " / Number: " + element.nb;
                                });
                            }
                        }
                    }
                }
            }
            return valueToDisplay;
        }

        /**
         * Change grouping
         */
        $scope.change = function() {
            changeInterval(currentDate, $scope.interval, 0);
        };

        //create new reading with prefilled date and time
        $scope.addEvent = function(day, period) {
            //if only one event type selected, add this one
            if ($scope.display.length === 1) {
                goToaddEvent($scope.display[0], day, period);
            } else {
                //display modal window to choose the type of event
                var $modalScope = $rootScope.$new(true);
                $modalScope.eventsTypes = getEventTypes();
                var modalInstance = $modal.open({
                    templateUrl: "views/modal/chooseEvent.html",
                    controller: "chooseEventController",
                    scope: $modalScope,
                    resolve: {
                        confirmed: function() {
                            return $scope.code;
                        }
                    }
                });
                modalInstance.result.then(function(eventCode) {                    
                    if (eventCode) {
                        goToaddEvent(eventCode, day, period);
                    }
                }, function() {
                    //exit
                });
            }
        };

        function goToaddEvent(eventCode, day, period) {
            $location.path('event/' + ResourceCode[eventCode]).search('day', day.date.toISOString()).search('time', period.begin.toISOString());
        }



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
                            angular.forEach($scope.periods, function(per, index) {
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





        function changeInterval(currentDate, interval, coef) {
            var newDate = new Date(currentDate.getTime());
            switch (interval) {
                case 'day':
                    newDate.setDate(newDate.getDate() + (1 * coef));
                    break;
                case 'week':
                    newDate.setDate(newDate.getDate() + (7 * coef));
                    break;
                case 'month':
                    newDate.setMonth(newDate.getMonth() + (1 * coef));
                    break;
                case 'year':
                    newDate.setFullYear(newDate.getFullYear() + (1 * coef));
                    break;
            }
            $location.path('overview').search('weekDate', newDate.toISOString()).search('interval', interval).search('display', getDisplayParam($scope.display));
        }

        $scope.zoomInInterval = function(date) {
            var newInterval = '';
            switch ($scope.interval) {
                case 'month':
                    newInterval = 'week';
                    break;
                case 'year':
                    newInterval = 'month';
                    break;
                default:
                    newInterval = $scope.interval;
                    break;
            }
            $location.path('overview').search('weekDate', date.toISOString()).search('interval', newInterval);
        };





        $scope.advance = function() {
            changeInterval(currentDate, $scope.interval, +1);
        };

        $scope.back = function() {
            changeInterval(currentDate, $scope.interval, -1);
        };

        $scope.currentWeek = function() {
            currentDate = new Date();
            changeInterval(currentDate, $scope.interval, 0);
        };

        $window.addEventListener('dataReady', renderPage);

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            //clear messages
            $rootScope.messages = [];
            //clear events
            $window.removeEventListener('dataReady', renderPage);
        });
    }]);

