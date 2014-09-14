var DirectivesModule = angular.module("BloGlu.directives");

DirectivesModule.directive('dataviz', function($compile) {
    var linkFunction = function(scope, element, attrs) {
        scope.$watch('config', function(newValue, oldValue) {
            element.empty();
            if (newValue) {
                var config = angular.fromJson(newValue);
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
            }
        });
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



DirectivesModule.directive('tableDataviz', ['$compile', 'dataService', function($compile, dataService) {
        var linkFunction = function(scope, element, attrs) {
            if (scope.config) {
                buildTable(element, scope.config);
            }
            scope.$watch('config', function(newValue, oldValue) {
                buildTable(element, scope);
            }, true);

            scope.$watch('columnOrder', function(newValue, oldValue) {
                buildTable(element, scope);
            }, true);

        };

        function buildTable(element, scope) {
            element.empty();
            if (scope.config) {
                var htmlElement = null;
                if (scope.config && scope.config.data) {
                    if (scope.config.headers && scope.config.headers.length === 1 && scope.config.data && scope.config.data.length === 1) {
                        htmlElement = buildSingleValueTable(scope);
                    } else {
                        htmlElement = buildMultipleValueTable(scope);
                    }
                }
                if(scope.config.title){
                    angular.element(element).append(buildTitle(scope.config.title));
                }
                angular.element(element).append(htmlElement);
            }
        }
        
        function buildTitle(title){
            var titleElement = document.createElement('h3');
            titleElement.appendChild(document.createTextNode(title));
            return titleElement;
        }
        

        function buildSingleValueTable(scope) {
            var config = scope.config;
            var div = document.createElement('div');

            var title = document.createElement('h1');
            var value = document.createElement('span');

            //title.appendChild(document.createTextNode(config.headers[0].title + ": "));
            value.appendChild(document.createTextNode(config.data[0][config.headers[0].name]));

            title.appendChild(value);
            div.appendChild(title);

            return div;
        }

        function buildMultipleValueTable(scope) {
            var table = document.createElement('table');
            table.className = 'table';
            angular.forEach(scope.config.headers, function(header) {
                var th = document.createElement('th');
                th.addEventListener('click', headerClicked.bind({scope: scope, header: header}));
                var headerLink = document.createElement('a');
                headerLink.appendChild(document.createTextNode(header.title));
                var directionSpan = document.createElement('span');

                directionSpan.className = getHeaderDirection(header.name);

                directionSpan.id = 'th-' + header.name;

                th.appendChild(headerLink);
                th.appendChild(directionSpan);
                table.appendChild(th);
            });

            function getHeaderDirection(headerName) {
                var headerDirection = '';
                if (scope.columnOrder && Array.isArray(scope.columnOrder)) {
                    angular.forEach(scope.columnOrder, function(columnOrder) {
                        if (columnOrder.alias === headerName) {
                            if (columnOrder.direction) {
                                if (columnOrder.direction.toUpperCase() === 'ASC') {
                                    headerDirection = 'glyphicon glyphicon-chevron-up';
                                } else {
                                    if (columnOrder.direction.toUpperCase() === 'DESC') {
                                        headerDirection = 'glyphicon glyphicon-chevron-down';
                                    }
                                }
                            }
                        }
                    });
                }
                return headerDirection;
            }
            dataService.orderBy(scope.config.data, scope.columnOrder);

            angular.forEach(scope.config.data, function(row) {
                var tr = document.createElement('tr');
                angular.forEach(scope.config.headers, function(header) {
                    var td = document.createElement('td');
                    td.appendChild(document.createTextNode(row[header.name]));
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });
            return table;
        }


        function headerClicked(eventInfo) {
            var containsClause = false;
            if (!this.scope.columnOrder) {
                this.scope.columnOrder = [];
            } else {
                var that = this;
                angular.forEach(this.scope.columnOrder, function(orderClause, index) {
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



DirectivesModule.directive('chartDataviz', ['$compile', 'dataService', function($compile, dataService) {
        var linkFunction = function(scope, element, attrs) {
            renderChart(scope.config, scope, element);
            scope.$watch('config', function(newValue, oldValue) {
                if (newValue && newValue !== oldValue) {
                    var config = angular.fromJson(newValue);
                    renderChart(config, scope, element);
                }
            });
        };

        function renderChart(configuration, scope, element) {
            var config = angular.fromJson(configuration);
            if (scope.columnOrder) {
                dataService.orderBy(scope.config.data, scope.columnOrder);
            }

            computeChartData(scope, config);
            if (angular.element(element).find('highchart').length) {
                $compile(element)(scope);
            } else {
                element.empty();
                var chart = $compile('<highchart config="chartConfig"></highchart>')(scope);
            }
            angular.element(element).append(chart);
        }

        function computeChartData(scope, config) {
            scope.chartConfig = {
                options: {
                    chart: {
                        type: 'line',
                        //zoomType: 'x',
                        spacingTop: 0,
                        spacingLeft: 0,
                        spacingRight: 0,
                        spacingBottom: 0,
                        //TODO: to remove
                        width: 350,
                        height: 350
                    }
                },
                series: [],
                title: {
                    text: ''
                }
            };
            if(config.title){
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
            getChartSeries(scope, config);
        }
        
        
        
        function getChartSeries(scope, config) {
            switch (config.type) {
                case 'pieChart':
                    getPieChartSerie(scope, config);
                    break;
                case 'chart':
                case 'lineChart':
                case 'barChart':
                    getChartSerie(scope, config);
                    break;
            }
        }
        
        function getPieChartSerie(scope, config){
            var serieQueryElement = null;
            angular.forEach(config.headers, function(queryElement) {
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
            for (var lineIndex = 0; lineIndex < config.data.length; lineIndex++) {
                var textValue = '';
                var numericValue = null;
                for (var columnIndex = 0; columnIndex < config.headers.length; columnIndex++) {                    
                    var propertyName = config.headers[columnIndex].name;
                    if (config.headers[columnIndex].aggregate) {
                        numericValue = parseInt(config.data[lineIndex][propertyName]);                        
                    } else {
                        textValue += " " + config.data[lineIndex][propertyName];
                    }
                }
                serie.data.push([textValue, numericValue]);
            }
            
        }
        

        function getChartSerie(scope, config) {
            
            scope.chartConfig.xAxis = {};
            scope.chartConfig.xAxis.categories = [];
            
            angular.forEach(config.headers, function(queryElement) {
                if (queryElement.aggregate) {
                    scope.chartConfig.series.push({name: queryElement.title, data: []});
                }
            });
            for (var lineIndex = 0; lineIndex < config.data.length; lineIndex++) {
                var textValue = '';
                for (var columnIndex = 0; columnIndex < config.headers.length; columnIndex++) {
                    var propertyTitle = config.headers[columnIndex].title;
                    var propertyName = config.headers[columnIndex].name;
                    if (config.headers[columnIndex].aggregate) {
                        var serie = getSerieByTitle(scope.chartConfig.series, propertyTitle);
                        serie.data.push(parseInt(config.data[lineIndex][propertyName]));
                    } else {
                        textValue += " " + config.data[lineIndex][propertyName];
                    }
                }
                scope.chartConfig.xAxis.categories.push(textValue);
            }
        }



        function getSerieByTitle(series, name) {
            var foundSerie = null;
            angular.forEach(series, function(serie) {
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