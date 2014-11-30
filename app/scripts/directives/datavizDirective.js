var DirectivesModule = angular.module("BloGlu.directives");

DirectivesModule.directive('dataviz', function ($compile) {
    var linkFunction = function (scope, element, attrs) {
        //scope.$watch('config', function (newValue, oldValue) {
            element.empty();
            //if (newValue) {
                var config = angular.fromJson(scope.config);
                scope.datavizConfig = config;
                var dataviz = null;
                switch (config.type) {
                    case 'table':
                        dataviz = $compile('<table-dataviz column-order="columnOrder" config="config"></table-dataviz>')(scope);
                        break;
                    case 'chart':
                    case 'pieChart':
                    case 'barChart':
                    case 'lineChart':
                        dataviz = $compile('<chart-dataviz column-order="columnOrder" config="config"></chart-dataviz>')(scope);
                        break;
                    default:
                        dataviz = $compile('<table-dataviz column-order="columnOrder" config="config"></table-dataviz>')(scope);
                        break;
                }
                angular.element(element).append(dataviz);
            //}
        //});
    };
    return {
        restrict: 'E', // only activate on element
        replace: true,
        scope: {
            config: '=',
            columnOrder: '='
        },
        link: linkFunction
    };
});



DirectivesModule.directive('tableDataviz', ['$q', '$translate', 'dataService', function ($q, $translate, dataService) {
        var linkFunction = function (scope, element, attrs) {
            buildTable(element, scope);
            /*
            scope.$watch('config', function (newValue, oldValue) {
                buildTable(element, scope);
            }, true);

            scope.$watch('columnOrder', function (newValue, oldValue) {
                buildTable(element, scope);
            }, true);
            */
        };

        function buildTable(element, scope) {
            if (scope.config) {
                var htmlElement = null;
                angular.element(element).append(buildLoadingDisplay());
                
                if (scope.config.data) {                    

                    $q.all([
                        scope.config.data,
                        scope.config.units
                    ]).then(function (results) {                        
                        var data = results[0];
                        var units = results[1];
                        var headers = scope.config.headers;
                        var columnOrder = scope.columnOrder;

                        element.empty();
                        if (headers && headers.length === 1 && data && data.length === 1) {
                            htmlElement = buildSingleValueTable(headers, data, units);
                            angular.element(element).append(buildTitle(scope.config.title));
                            angular.element(element).append(htmlElement);
                        } else {
                            //if no data returned
                            if (headers && headers.length === 1 && data && data.length === 0) {
                                htmlElement = buildNoValueDisplay();
                                angular.element(element).append(buildTitle(scope.config.title));
                                angular.element(element).append(htmlElement);
                            } else {
                                htmlElement = buildMultipleValueTable(headers, data, units, columnOrder);                               
                                angular.element(element).append(buildTitle(scope.config.title));
                                angular.element(element).append(htmlElement);
                                angular.element(element).append(buildUnitDescription(units));
                            }
                        }
                    });
                }
            }
        }
        function buildTitle(title) {
            var titleElement = document.createElement('h3');
            if(title){
                titleElement.appendChild(document.createTextNode(title));
            }
            return titleElement;
        }

        function buildUnitDescription(reportUnits) {
            var unitDescriptionElement = document.createElement('div');
            angular.forEach(reportUnits, function (reportUnit) {
                var unitSection = document.createElement('span');
                unitSection.className = 'label label-primary';
                unitSection.appendChild(document.createTextNode($translate.instant(reportUnit.title) + ': ' + reportUnit.unit.description));
                unitDescriptionElement.appendChild(unitSection);
            });
            return unitDescriptionElement;
        }

        function buildSingleValueTable(headers, data, reportUnits) {            
            var div = document.createElement('div');
            var title = document.createElement('h1');
            var value = document.createElement('span');
            value.appendChild(document.createTextNode(data[0][headers[0].name] + ' ' + reportUnits[0].unit.description));
            title.appendChild(value);
            div.appendChild(title);
            return div;
        }

        function buildNoValueDisplay() {
            var div = document.createElement('div');
            var title = document.createElement('h4');
            var value = document.createElement('span');
            value.appendChild(document.createTextNode($translate.instant('noData')));
            title.appendChild(value);
            div.appendChild(title);
            return div;
        }

        function buildLoadingDisplay() {
            var div = document.createElement('div');
            var image = document.createElement('img');
            image.alt = 'loading';
            image.src = 'images/spinner.gif';
            div.appendChild(image);
            return div;
        }



        function buildMultipleValueTable(headers, data, reportUnits, columnOrder) {
            var container = document.createElement('div');            
            container.className = 'table-responsive dataviz';
            var table = document.createElement('table');            
            table.className = 'table table-striped';
            var tableBody = document.createElement('tbody');
            angular.forEach(headers, function (header) {
                var th = document.createElement('th');
                //th.addEventListener('click', headerClicked.bind({scope: scope, header: header}));
                var headerLink = document.createElement('a');
                headerLink.appendChild(document.createTextNode(header.title));
                var directionSpan = document.createElement('span');

                //directionSpan.className = getHeaderDirection(header.name);

                directionSpan.id = 'th-' + header.name;

                th.appendChild(headerLink);
                th.appendChild(directionSpan);
                tableBody.appendChild(th);
            });

            function getHeaderDirection(headerName) {
                var headerDirection = '';
                if (scope.columnOrder && Array.isArray(columnOrder)) {
                    angular.forEach(columnOrder, function (order) {
                        if (order.alias === headerName) {
                            if (order.direction) {
                                if (order.direction.toUpperCase() === 'ASC') {
                                    headerDirection = 'glyphicon glyphicon-chevron-up';
                                } else {
                                    if (order.direction.toUpperCase() === 'DESC') {
                                        headerDirection = 'glyphicon glyphicon-chevron-down';
                                    }
                                }
                            }
                        }
                    });
                }
                return headerDirection;
            }
            dataService.orderBy(data, columnOrder);

            angular.forEach(data, function (row) {
                var tr = document.createElement('tr');
                angular.forEach(headers, function (header) {
                    var td = document.createElement('td');
                    td.appendChild(document.createTextNode(row[header.name]));
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });
            table.appendChild(tableBody);
            container.appendChild(table);
            
            return container;
        }


        function headerClicked(eventInfo) {
            var containsClause = false;
            if (!this.scope.columnOrder) {
                this.scope.columnOrder = [];
            } else {
                var that = this;
                angular.forEach(this.scope.columnOrder, function (orderClause, index) {
                    if (orderClause.alias === that.header.name) {
                        containsClause = true;
                        if (orderClause.direction === 'ASC') {
                            orderClause.direction = 'DESC';
                        } else {
                            if (orderClause.direction === 'DESC') {
                                that.scope.columnOrder.splice(index, 1);
                            } else {
                                orderClause.direction = 'ASC';
                            }
                        }
                    }
                });
                if (!containsClause) {
                    var sortClause = {
                        alias: this.header.name,
                        direction: 'ASC'
                    };
                    if (this.header.sort) {
                        //sortClause.sort = dataService.sort[this.header.sort];
                        sortClause.sort = this.header.sort;
                    }
                    this.scope.columnOrder.push(sortClause);
                }
            }
            this.scope.$apply();
        }
        return {
            restrict: 'E', // only activate on element
            replace: true,
            scope: {
                config: '=',
                columnOrder: '='
            },
            link: linkFunction
        };
    }]);



DirectivesModule.directive('chartDataviz', ['$compile', '$q', 'dataService', 'reportService', function ($compile, $q, dataService, reportService) {
        var linkFunction = function (scope, element, attrs) {
            renderChart(scope, element);
            /*
            scope.$watch('config', function (newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    renderChart(scope, element);
                }
            });
            */
        };

        function renderChart(scope, element) {

            $q.all([
                scope.config.data,
                scope.config.units
            ]).then(function (results) {
                var data = results[0];
                var units = results[1];
                var columnOrder = scope.columnOrder;

                if (scope.columnOrder) {
                    dataService.orderBy(data, columnOrder);
                }
                computeChartData(scope, data, scope.config, units);
                if (angular.element(element).find('highchart').length) {
                    $compile(element)(scope);
                } else {
                    element.empty();
                    var chart = $compile('<highchart config="chartConfig"></highchart>')(scope);
                }
                angular.element(element).append(chart);

            });


        }

        function computeChartData(scope, data, config, reportUnits) {
            scope.chartConfig = {
                options: {
                    chart: {
                        type: 'line',
                        width: 300,
                        height: 300
                    }
                },
                series: [],
                title: {
                    text: ''
                }
            };
            if (config.title) {
                scope.chartConfig.title.text = config.title;
            }
            //handle chart type
            switch (config.type) {
                case 'pieChart':
                    scope.chartConfig.options.chart.type = 'pie';
                    break;
                case 'barChart':
                    scope.chartConfig.options.chart.type = 'bar';
                    break;
                case 'lineChart':
                    scope.chartConfig.options.chart.type = 'line';
                    break;
            }
            getChartSeries(scope, data, config, reportUnits);
        }



        function getChartSeries(scope, data, config, reportUnits) {
            switch (config.type) {
                case 'pieChart':
                    getPieChartSerie(scope, data, config, reportUnits);
                    break;
                case 'chart':
                case 'lineChart':
                case 'barChart':
                    getChartSerie(scope, data, config, reportUnits);
                    break;
            }
        }

        function getPieChartSerie(scope, data, config, reportUnits) {
            var serieQueryElement = null;
            angular.forEach(config.headers, function (queryElement) {
                if (queryElement.aggregate) {
                    serieQueryElement = queryElement;
                    return;
                }
            });
            var serie = {
                type: 'pie',
                name: serieQueryElement.title,
                data: []
            };
            scope.chartConfig.series.push(serie);
            for (var lineIndex = 0; lineIndex < data.length; lineIndex++) {
                var textValue = '';
                var numericValue = null;
                for (var columnIndex = 0; columnIndex < config.headers.length; columnIndex++) {
                    var propertyName = config.headers[columnIndex].name;
                    if (config.headers[columnIndex].aggregate) {
                        numericValue = parseInt(data[lineIndex][propertyName]);
                    } else {
                        textValue += " " + data[lineIndex][propertyName];
                    }
                }
                serie.data.push([textValue, numericValue]);
            }

        }


        function getChartSerie(scope, data, config, reportUnits) {

            scope.chartConfig.xAxis = {};
            scope.chartConfig.xAxis.categories = [];

            angular.forEach(config.headers, function (queryElement) {
                if (queryElement.aggregate) {
                    scope.chartConfig.series.push({name: getSerieTitle(reportUnits, queryElement.title), data: []});
                }
            });
            for (var lineIndex = 0; lineIndex < data.length; lineIndex++) {
                var textValue = '';
                for (var columnIndex = 0; columnIndex < config.headers.length; columnIndex++) {
                    var propertyTitle = getSerieTitle(reportUnits, config.headers[columnIndex].title);
                    var propertyName = config.headers[columnIndex].name;
                    if (config.headers[columnIndex].aggregate) {
                        var serie = getSerieByTitle(scope.chartConfig.series, propertyTitle);
                        serie.data.push(parseInt(data[lineIndex][propertyName]));
                    } else {
                        textValue += " " + data[lineIndex][propertyName];
                    }
                }
                scope.chartConfig.xAxis.categories.push(textValue);
            }
        }


        function getSerieTitle(reportUnits, name) {
            var foundDescription = "";
            var serieTitle = name;
            angular.forEach(reportUnits, function (unit) {
                if (unit.title === name) {
                    foundDescription = unit.unit.description;
                    return;
                }
            });
            if (foundDescription) {
                serieTitle = serieTitle + ': ' + foundDescription;
            }
            return serieTitle;
        }


        function getSerieByTitle(series, name) {
            var foundSerie = null;
            angular.forEach(series, function (serie) {
                if (serie.name === name) {
                    foundSerie = serie;
                    return;
                }
            });
            return foundSerie;
        }

        return {
            restrict: 'E', // only activate on element
            replace: true,
            scope: {
                config: '=',
                columnOrder: '='
            },
            link: linkFunction
        };
    }]);