'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('printService', ['$q', '$filter', 'ResourceCode', 'unitService', function ($q, $filter, ResourceCode, unitService) {
        var printService = {};

        var defaultParams = {
            table:{
                contentTextfontSize: 12,
                titleTextFontSize: 14,
                contentTextFontType: "normal",
                titleTextFontType: "bold",
                cellHeight: 35,
                contentCellWidth: 100,
                titleCellWidth: 130
            },
            title:{
                fontSize: 25
            }
        };


        function getCellHeight(cellData, interval, params) {
            var cellHeight = params.cellHeight;
            if (Array.isArray(cellData) && cellData.length > 0) {
                cellHeight = cellData.length * cellHeight;
            }
            return cellHeight;
        }

        function getCellWidth(rowIndex, columnIndex, interval, cell, tableData, params) {
            var cellWidth = params.contentCellWidth;
            if (columnIndex === 0) {
                cellWidth = params.titleCellWidth;
            }
            if(interval !== 'week'){
                cellWidth = params.titleCellWidth * 2;
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

            var height = getCellHeight(cellData, interval, params);
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
                    } else {                        
                        if (cellData && Array.isArray(cellData)) {
                            angular.forEach(cellData, function (element) {
                                valueToDisplay = "Maximum: " + element.maximum + " / Minimum: " + element.minimum + " / Average: " + element.average + " / Number: " + element.nb;
                            });
                        }
                    }
                }

            }
            doc.cell(10, 50, width, height, valueToDisplay, rowIndex);
        };


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
        };

        printService.printLogBook = function(tableData, interval, timeInterval, eventTypes, inputParams){
            var deferred = $q.defer();
            inputParams = inputParams || {};
            var printParams = angular.extend(inputParams, defaultParams);
            
            var doc = new jsPDF('l', 'pt', 'a4', true);
            doc.setFontSize(printParams.title.fontSize);
            doc.text(10, 25, "Title");
                     
            convertTableToPDF(doc, tableData, interval, eventTypes, printParams).then(function(){
                doc.save('sample-file.pdf');
                deferred.resolve();
            });            
            return deferred.promise;            
        };



        return printService;
    }]);