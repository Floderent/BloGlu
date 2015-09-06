(function () {
    'use strict';

    angular.module('bloglu.print')
            .factory('printUtilsService', printUtilsService);

    printUtilsService.$inject = ['$filter', 'translationService', 'ResourceName'];

    function printUtilsService($filter, translationService, ResourceName) {

        var logbookPrintFormats = {
            week: {
                getColumnWidth: getWeekColumnWidth,
                getRowHeight: getWeekRowHeight,
                renderCell: renderWeekCell
            },
            day: {
                getColumnWidth: getColumnWidth,
                getRowHeight: getRowHeight,
                renderCell: renderAggregatedCell
            },
            month: {
                getColumnWidth: getColumnWidth,
                getRowHeight: getRowHeight,
                renderCell: renderAggregatedCell
            },
            year: {
                getColumnWidth: getColumnWidth,
                getRowHeight: getRowHeight,
                renderCell: renderAggregatedCell
            }
        };

        var printUtilsService = {
            logbookPrintFormats: logbookPrintFormats
        };
        return printUtilsService;

        function getWeekColumnWidth(rowIndex, columnIndex, tableData, params) {
            var columnWidth = params.table.contentCellWidth;
            if (columnIndex === 0) {
                columnWidth = params.table.titleCellWidth;
            } else {
                columnWidth = params.table.contentCellWidth;
            }
            return columnWidth;
        }


        function getColumnWidth(rowIndex, columnIndex, tableData, params) {
            var columnWidth = params.table.titleCellWidth * 1.2;
            return columnWidth;
        }

        function getRowHeight(rowIndex, cellData, params) {
            var rowHeight = params.table.cellHeight;
            if(rowIndex === 0){
                rowHeight = params.table.cellHeight;
            }else{                
                var numberOfLine = 0;
                angular.forEach(cellData, function (element) {
                    angular.forEach(element, function (value, key) {
                        numberOfLine++;
                    });
                });
                rowHeight = params.table.cellHeight * (3 * numberOfLine);
            }
            return rowHeight;
        }

        function getWeekRowHeight(rowIndex, cellData, params) {
            var rowHeight = params.table.cellHeight;
            if (Array.isArray(cellData) && cellData.length > 0) {
                var newRowHeight = cellData.length * rowHeight;
                if (newRowHeight > rowHeight) {
                    rowHeight = newRowHeight;
                }
            }
            return rowHeight;
        }

        function renderWeekCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params) {
            var valueToDisplay = ' ';
            if (rowIndex === 0) {
                valueToDisplay = renderTitleRow(doc, rowIndex, columnIndex, interval, cellData, tableData, params);
            } else {
                if (columnIndex === 0) {
                    doc.setFontType(params.table.titleTextFontType);
                    doc.setFontSize(params.table.titleTextFontSize);
                    valueToDisplay = $filter('date')(cellData.date, 'EEEE d MMM');
                } else {                    
                    if (cellData && Array.isArray(cellData)) {
                        angular.forEach(cellData, function (element) {
                            valueToDisplay += $filter('date')(element.dateTime, 'HH:mm') + '\n ' + element.reading + ' ' + params[element.code].name + '\n';
                        });
                    }
                }
            }
            return valueToDisplay;
        }

        function renderAggregatedCell(doc, rowIndex, columnIndex, interval, cellData, tableData, params) {
            var valueToDisplay = '';
            if (rowIndex === 0) {
                valueToDisplay = renderTitleRow(doc, rowIndex, columnIndex, interval, cellData, tableData, params);
            } else {
                if (cellData && Array.isArray(cellData)) {
                    angular.forEach(cellData, function (element) {
                        if (element) {                            
                            angular.forEach(element, function (value, key) {
                                valueToDisplay += [
                                    translationService.translate(ResourceName[parseInt(key)]),
                                    translationService.translate('logBook.average') + ' ' + value.average + ' ' + params[value.code].name,
                                    translationService.translate('logBook.maximum')+ ' ' + value.maximum + ' ' + params[value.code].name,
                                    translationService.translate('logBook.minimum') + ' ' + value.minimum + ' ' + params[value.code].name,                                    
                                    translationService.translate('logBook.number') + ' ' + value.number,
                                    '\n'
                                ].join('\n');
                            });
                        }
                    });
                }
            }
            return valueToDisplay;
        }

        function renderTitleRow(doc, rowIndex, columnIndex, interval, cellData, tableData, params) {
            var valueToDisplay = '';
            if (cellData.name) {
                doc.setFontType(params.table.titleTextFontType);
                doc.setFontSize(params.table.titleTextFontSize);
                valueToDisplay = cellData.name;
            }
            return valueToDisplay;
        }



    }
})();