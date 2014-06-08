'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('overviewController', ['$scope', '$rootScope', '$location', '$routeParams', '$filter', '$window', 'ResourceCode', 'overViewService', 'MessageService', 'printService', function Controller($scope, $rootScope, $location, $routeParams, $filter, $window, ResourceCode, overViewService, MessageService, printService) {

        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.data = [];


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
        $scope.timeInterval = overViewService.getTimeInterval($scope.interval, currentDate);

        //display only blood glucose readings
        var params = {where: {code: [1]}};
        renderPage();


        function renderPage() {
            $rootScope.pending++;
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
                                cellData.forEach(function(element) {
                                    valueToDisplay += $filter('date')(element.dateTime, 'HH:mm') + " " + element.reading + " ";
                                });
                            }
                        } else {
                            if (cellData && Array.isArray(cellData)) {
                                cellData.forEach(function(element) {
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


        //view reading by id
        $scope.viewEvent = function(code, objectId) {
            var path = 'event/' + ResourceCode[code] + "/" + objectId;
            $location.path(path);
        };

        //create new reading with prefilled date and time
        $scope.addEvent = function(day, period) {
            //TODO display modal window to choose the type of event



            $location
                    .path('event')
                    .search('day', day.date.toISOString())
                    .search('time', period.begin.toISOString());
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
            $location.path('overview').search('weekDate', newDate.toISOString()).search('interval', interval);
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

