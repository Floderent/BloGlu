'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('logBookController', ['$scope', '$rootScope', '$location', '$routeParams', '$modal', 'ResourceName', 'ResourceCode', 'logBookService', 'MessageService', 'printService', function Controller($scope, $rootScope, $location, $routeParams, $modal, ResourceName, ResourceCode, logBookService, MessageService, printService) {

        $scope.data = [];
        $scope.eventsTypes = ResourceName;
        $scope.display = [1];
        //default display blood glucose

        $scope.currentDate = null;
        $scope.interval = 'week';


        if ($routeParams && $routeParams.weekDate) {
            $scope.currentDate = new Date($routeParams.weekDate);
        } else {
            $scope.currentDate = new Date();
        }
        if ($routeParams && $routeParams.interval) {
            $scope.interval = $routeParams.interval;
        }
        if ($routeParams && typeof $routeParams.display !== 'undefined') {
            $scope.display = $routeParams.display;
            processDisplay();
        } else {
            $scope.display = [1];
            $scope.resource = {1: true};
        }

        $scope.$watch('resource', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                var resourceCodes = [];
                angular.forEach(newValue, function(value, key) {
                    if (value) {
                        resourceCodes.push(parseInt(key));
                    }
                });
                //renderPage();
                $scope.display = resourceCodes;
                $location.url($location.path());
                $location.path('logBook').search('weekDate', $scope.currentDate.toISOString()).search('interval', $scope.interval).search('display', logBookService.getDisplayParam($scope.display));
            }
        }, true);


        $scope.timeInterval = logBookService.getTimeInterval($scope.interval, $scope.currentDate);

        renderPage();

        function renderPage() {
            $rootScope.increasePending("processingMessage.loadingData");
            var params = {where: {code: {$in: $scope.display}}};
            logBookService.getTableData($scope.timeInterval, params).then(
                    function resolve(result) {
                        $scope.header = result[0];
                        $scope.data = result;
                    },
                    function reject(error) {
                        $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
                        $scope.header = [];
                        $scope.data = [];
                    })['finally'](function() {
                $rootScope.decreasePending("processingMessage.loadingData");
            });
        }

        function processDisplay() {
            var intStrArray = $scope.display.split(',');
            var intArray = [];
            var resource = {};
            angular.forEach(intStrArray, function(value, key) {
                if(parseInt(value) === parseInt(value)){
                    intArray.push(parseInt(value));
                    resource[parseInt(value)] = true;
                }
            });
            $scope.resource = resource;
            $scope.display = intArray;
        }

        function goToaddEvent(eventCode, day, period) {
            $location.url($location.path());
            var newEventDate = logBookService.getMiddleTime(period);
            $location.path('event/' + ResourceCode[eventCode]).search('day', day.date.toISOString()).search('time', newEventDate.toISOString());
        }

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
            $scope.currentDate = newDate;
            $location.url($location.path());
            $location.path('logBook').search('weekDate', $scope.currentDate.toISOString()).search('interval', interval).search('display', logBookService.getDisplayParam($scope.display));
        }

        $scope.printToPDF = function() {
            printService.convertTableToPDF($scope.data, printService.renderCell.bind({
                interval: $scope.interval
            }));
        };

        /**
         * Change grouping
         */
        $scope.change = function() {
            changeInterval($scope.currentDate, $scope.interval, 0);
        };

        //create new reading with prefilled date and time
        $scope.addEvent = function(day, period) {
            //if only one event type selected, add this one            
            if ($scope.display.length === 1) {
                goToaddEvent($scope.display[0], day, period);
            } else {
                //display modal window to choose the type of event
                var $modalScope = $rootScope.$new(true);
                $modalScope.eventsTypes = logBookService.getEventTypes($scope.display);
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
            $location.url($location.path());
            $location.path('logBook').search('weekDate', date.toISOString()).search('interval', newInterval);
        };

        $scope.advance = function() {
            changeInterval($scope.currentDate, $scope.interval, +1);
        };

        $scope.back = function() {
            changeInterval($scope.currentDate, $scope.interval, -1);
        };

        $scope.currentWeek = function() {
            currentDate = new Date();
            changeInterval($scope.currentDate, $scope.interval, 0);
        };
        $rootScope.$on('dataReady', renderPage);
    }]);

