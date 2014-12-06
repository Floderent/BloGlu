'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('printService', ['$q', '$filter', 'UserService', 'ResourceCode', function($q, $filter, UserService, ResourceCode) {
        var printService = {};
        
        function getCellHeight(cellData){
            var cellHeight = 50;
            if(Array.isArray(cellData) && cellData.length > 0){
                cellHeight = cellData.length * cellHeight;
            }            
            return cellHeight;
        }
        
        function getCellWidth(rowIndex, columnIndex, cell, tableData){
            var cellWidth = 120;
            if(columnIndex === 0){
                cellWidth = 150;
            }
            return cellWidth;
        }
        
        function getParameters(eventTypes){
            var deferred = $q.defer();
            var promiseArray = [];
            angular.forEach(eventTypes, function(value){
                promiseArray.push(UserService.getDefaultUnit(ResourceCode[value]));
            });
            var result = {};
            $q.all(promiseArray).then(function(results){                
                for(var index in eventTypes){
                    result[index] = results[index];
                }
                deferred.resolve(result);
            });
            return deferred.promise;
        }
        
        
        printService.renderCell = function (doc, rowIndex, columnIndex, cellData, tableData, params) {
            
            var height = getCellHeight(cellData);
            var width = getCellWidth(rowIndex, columnIndex, cellData, tableData);
            var interval = "week";
                       
            var valueToDisplay = " ";
            if (cellData) {
                if (rowIndex === 0) {
                    if (cellData.name) {
                        doc.setFontType("bold");
                        valueToDisplay = cellData.name;
                    }
                } else {
                    if (columnIndex === 0) {
                        doc.setFontType("bold");
                        if (interval === 'week') {
                            valueToDisplay = $filter('date')(cellData.date, 'EEEE d MMM');
                        } else {
                            if (cellData.text) {
                                valueToDisplay = cellData.text;
                            }
                        }
                    } else {
                        if (interval === 'week') {
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
            doc.cell(10, 50, width, height, valueToDisplay, rowIndex);            
        };
                
        
        printService.convertTableToPDF = function(tableData, eventTypes) {            
            var doc = new jsPDF('l', 'pt', 'a4', true);
            var params = {};
            doc.cellInitialize();
            for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                var row = tableData[rowIndex];
                for (var columnIndex = 0; columnIndex < tableData[0].length; columnIndex++) {
                    var cellData = row[columnIndex];                    
                    // ? ? width height                    
                    printService.renderCell(doc, rowIndex, columnIndex, cellData, tableData, params);
                }                
            }
            doc.save('sample-file.pdf');
        };
        return printService;
    }]);