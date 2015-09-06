(function () {
    'use strict';

    angular.module('bloglu.print')
            .factory('printService', printService);

    printService.$inject = ['$q', '$filter', 'printUtilsService', 'unitService'];

    function printService($q, $filter, printUtilsService, unitService) {

        var defaultParams = {
            table: {
                contentTextfontSize: 12,
                titleTextFontSize: 14,
                contentTextFontType: 'normal',
                titleTextFontType: 'bold',
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

        var printService = {
            printLogBook: printLogBook
        };
        return printService;


        function getTitle(timeInterval) {
            var title = '';
            if (timeInterval) {
                title = $filter('date')(timeInterval.begin, 'dd/MM/yyyy') + ' - ' + $filter('date')(timeInterval.end, 'dd/MM/yyyy');
            }
            return title;
        }

        function getFileName(timeInterval) {
            var title = 'logbook_';
            if (timeInterval) {
                title += $filter('date')(timeInterval.begin, 'ddMMyyyy') + '_' + $filter('date')(timeInterval.end, 'ddMMyyyy');
            }
            title += '.pdf';
            return title;
        }


        function getRowHeights(tableData, interval, params) {
            var rowHeights = [];
            for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                var row = tableData[rowIndex];
                var lineRowHeigths = [];
                for (var columnIndex = 0; columnIndex < tableData[0].length; columnIndex++) {
                    var cellData = row[columnIndex];
                    lineRowHeigths.push(printUtilsService.logbookPrintFormats[interval].getRowHeight(rowIndex, cellData, params));
                }                
                var max = Math.max.apply(null, lineRowHeigths);                
                rowHeights.push(max);
            }
            return rowHeights;
        }

        function getColumnWidths(tableData, interval, params) {
            var columnWidths = [];
            if (tableData.length > 0) {
                for (var columnIndex = 0; columnIndex < tableData[0].length; columnIndex++) {
                    columnWidths.push(printUtilsService.logbookPrintFormats[interval].getColumnWidth(0, columnIndex, tableData, params));
                }
            }
            return columnWidths;
        }

        function getParameters(eventTypes) {
            var promiseArray = [];
            angular.forEach(eventTypes, function (value) {
                promiseArray.push(unitService.getUnit(value));
            });
            var result = {};
            return $q.all(promiseArray).then(function (results) {
                for (var index in eventTypes) {
                    result[eventTypes[index]] = results[index];
                }
                return result;
            });
        }


        function renderCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params, newPage) {
            var height = params.rowHeights[rowIndex];
            var width = params.columnWidths[columnIndex];

            var valueToDisplay = ' ';
            //default values
            doc.setFontType(params.table.contentTextFontType);
            doc.setFontSize(params.table.contentTextfontSize);

            if (cellData) {
                valueToDisplay = printUtilsService.logbookPrintFormats[interval].renderCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params);
            }
            doc.cell(10, 50, width, height, valueToDisplay, rowIndex);            
        }

        function convertTableToPDF(doc, tableData, interval, eventTypes, inputParams) {
            return getParameters(eventTypes).then(function (params) {
                var printParams = angular.extend(inputParams, params);
                doc.cellInitialize();

                printParams.rowHeights = getRowHeights(tableData, interval, printParams);
                printParams.columnWidths = getColumnWidths(tableData, interval, printParams);

                var contentHeight = 50; 
                var pageHeight= doc.internal.pageSize.height;
                
                for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                    var row = tableData[rowIndex];                     
                    //check if new line will overflow                    
                    contentHeight += printParams.rowHeights[rowIndex];
                    //if it overflows, add a new page
                    if(contentHeight >= pageHeight){                        
                        contentHeight = 0;                        
                        doc.addPage();
                        doc.cellInitialize();
                    }                    
                    
                    for (var columnIndex = 0; columnIndex < tableData[0].length; columnIndex++) {
                        var cellData = row[columnIndex];
                        // ? ? width height                                               
                        renderCell(doc, rowIndex, columnIndex, interval, cellData, tableData, printParams);
                    }
                }
                return;
            });
        }

        function printLogBook(tableData, timeInterval, eventTypes, inputParams) {
            inputParams = inputParams || {};
            var printParams = angular.extend(inputParams, defaultParams);

            var doc = new jsPDF('l', 'pt', 'a4', true);
            doc.setFontSize(printParams.title.fontSize);

            var title = printParams.title.text || getTitle(timeInterval);
            doc.text(10, 25, title);

            return convertTableToPDF(doc, tableData, timeInterval.name, eventTypes, printParams).then(function () {
                doc.save(getFileName(timeInterval));
                return;
            });
        }

    }
})();