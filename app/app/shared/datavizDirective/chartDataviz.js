(function () {
    angular.module('bloglu.datavizDirective').directive('chartDataviz', chartDataviz);

    chartDataviz.$inject = ['$compile', '$q', '$translate', 'dataService'];

    function chartDataviz($compile, $q, $translate, dataService) {
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
                    scope.chartConfig.series.push({name: getSerieTitle(reportUnits, $translate.instant(queryElement.title)), data: []});
                }
            });
            for (var lineIndex = 0; lineIndex < data.length; lineIndex++) {
                var textValue = '';
                for (var columnIndex = 0; columnIndex < config.headers.length; columnIndex++) {
                    var propertyTitle = getSerieTitle(reportUnits, $translate.instant(config.headers[columnIndex].title));
                    var propertyName = config.headers[columnIndex].name;
                    if (config.headers[columnIndex].aggregate) {
                        var serie = getSerieByName(scope.chartConfig.series, propertyTitle);
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


        function getSerieByName(series, name) {
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
    }}
)();