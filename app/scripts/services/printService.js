'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('printService', ['$q', '$filter', '$translate', 'ResourceCode', 'unitService', function ($q, $filter, $translate, ResourceCode, unitService) {
        var printService = {};

        var defaultParams = {
            table: {
                contentTextfontSize: 12,
                titleTextFontSize: 14,
                contentTextFontType: "normal",
                titleTextFontType: "bold",
                cellHeight: 35,
                contentCellWidth: 100,
                titleCellWidth: 130                
            },
            title: {
                fontSize: 25,
                dayKey: 'logbook.day',
                weekKey: 'logbook.week',
                monthKey: 'logbook.month',
                yearKey: 'logbook.year'                
            }
        };

        function getTitle(timeInterval) {
            var title = "";
            if (timeInterval) {
                title = $filter('date')(timeInterval.begin, 'dd/MM/yyyy') + " - " + $filter('date')(timeInterval.end, 'dd/MM/yyyy');
            }
            return title;
        }

        function getCellHeight(rowIndex, columnIndex, interval, cellData, tableData, params) {
            var cellHeight = params.table.cellHeight;
            if (Array.isArray(cellData) && cellData.length > 0) {
                cellHeight = cellData.length * cellHeight;
            }
            if(rowIndex !== 0 && interval !== 'week'){
                cellHeight = cellHeight * 5;
            }
            return cellHeight;
        }

        function getCellWidth(rowIndex, columnIndex, interval, cellData, tableData, params) {
            var cellWidth = params.table.contentCellWidth;
            if (columnIndex === 0) {
                cellWidth = params.table.titleCellWidth;
            }
            if (interval !== 'week') {
                cellWidth = params.table.titleCellWidth * 1.5;
            }
            return cellWidth;
        }

        function getParameters(eventTypes) {
            var deferred = $q.defer();
            var promiseArray = [];
            angular.forEach(eventTypes, function (value) {
                promiseArray.push(unitService.getUnit(value));
            });
            var result = {};
            $q.all(promiseArray).then(function (results) {
                for (var index in eventTypes) {
                    result[eventTypes[index]] = results[index];
                }
                deferred.resolve(result);
            });
            return deferred.promise;
        }


        function renderCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params) {

            var height = getCellHeight(rowIndex, columnIndex, interval, cellData, tableData, params);
            var width = getCellWidth(rowIndex, columnIndex, interval, cellData, tableData, params);

            var valueToDisplay = " ";

            //default values
            doc.setFontType(params.table.contentTextFontType);
            doc.setFontSize(params.table.contentTextfontSize);

            if (cellData) {
                if (rowIndex === 0) {
                    if (cellData.name) {
                        doc.setFontType(params.table.titleTextFontType);
                        doc.setFontSize(params.table.titleTextFontSize);
                        valueToDisplay = cellData.name;
                    }
                } else {
                    if (interval === 'week') {
                        valueToDisplay = renderWeekCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params);
                    } else {
                        valueToDisplay = renderAggregatedCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params);
                    }
                }

            }
            doc.cell(10, 50, width, height, valueToDisplay, rowIndex);
        };


        function renderWeekCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params) {
            var valueToDisplay = "";
            if (columnIndex === 0) {
                doc.setFontType(params.table.titleTextFontType);
                doc.setFontSize(params.table.titleTextFontSize);
                valueToDisplay = $filter('date')(cellData.date, 'EEEE d MMM');
            } else {                
                if (cellData && Array.isArray(cellData)) {
                    angular.forEach(cellData, function (element) {
                        valueToDisplay += $filter('date')(element.dateTime, 'HH:mm') + "\n " + element.reading + " " + params[element.code].name;
                    });
                }
            }
            return valueToDisplay;
        }

        function renderAggregatedCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params) {
            var valueToDisplay = "";            
            if (cellData && Array.isArray(cellData)) {
                angular.forEach(cellData, function (element) {                    
                    if(element){
                        angular.forEach(element, function(value, key){                            
                            valueToDisplay = 
                                    " Maximum: " + value.maximum + " " + params[value.code].name +
                                    " \n Minimum: " + value.minimum + " " + params[value.code].name +
                                    " \n Average: " + value.average + " " + params[value.code].name +
                                    " \n Number: " + value.number;
                        });
                    }
                });
            }
            return valueToDisplay;
        }


        function convertTableToPDF(doc, tableData, interval, eventTypes, inputParams) {
            var deferred = $q.defer();
            getParameters(eventTypes).then(function (params) {
                var printParams = angular.extend(inputParams, params);
                doc.cellInitialize();
                for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                    var row = tableData[rowIndex];
                    for (var columnIndex = 0; columnIndex < tableData[0].length; columnIndex++) {
                        var cellData = row[columnIndex];
                        // ? ? width height                         
                        renderCell(doc, rowIndex, columnIndex, interval, cellData, tableData, printParams);
                    }
                }
                deferred.resolve();
            });
            return deferred.promise;
        }
        ;

        printService.printLogBook = function (tableData, timeInterval, eventTypes, inputParams) {
            var deferred = $q.defer();
            inputParams = inputParams || {};
            var printParams = angular.extend(inputParams, defaultParams);

            var doc = new jsPDF('l', 'pt', 'a4', true);
            doc.setFontSize(printParams.title.fontSize);

            var title = printParams.title.text || getTitle(timeInterval);
            doc.text(10, 25, title);

            convertTableToPDF(doc, tableData, timeInterval.name, eventTypes, printParams).then(function () {
                doc.save('sample-file.pdf');
                deferred.resolve();
            });
            return deferred.promise;
        };



        return printService;
    }]);