'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('printService', ['$filter', function($filter) {
        var printService = {};
        
        printService.renderCell = function (rowIndex, columnIndex, cellData, tableData) {
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
        };
                
        
        printService.convertTableToPDF = function(tableData, renderCellFunction) {            
            var doc = new jsPDF('l', 'pt', 'a4', true);
            doc.cellInitialize();
            for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                var row = tableData[rowIndex];
                for (var columnIndex = 0; columnIndex < row.length; columnIndex++) {
                    var cell = row[columnIndex];
                    doc.cell(10, 50, 120, 50, renderCellFunction(rowIndex, columnIndex, cell, tableData), rowIndex);
                }
                ;
            }
            doc.save('sample-file.pdf');
        };
        return printService;
    }]);