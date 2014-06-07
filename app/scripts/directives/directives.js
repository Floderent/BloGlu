var DirectivesModule = angular.module("BloGlu.directives");


DirectivesModule.directive('blogluEvent', ['$compile', '$injector', '$q', function($compile, $injector, $q) {
        var linkFunction = function(scope, element, attrs) {
            scope.$watch('event', function(newValue, oldValue) {

                //if (newValue && newValue !== oldValue) 
                {
                    var event = angular.fromJson(newValue);
                    var dataService = $injector.get('dataService');
                    var resourceCode = $injector.get('ResourceCode');

                    var promiseArray = [dataService.queryLocal('Unit', {where: {code: event.code}})];

                    if (event.code === resourceCode['bloodGlucose']) {
                        promiseArray.push(dataService.queryLocal('Range'));
                    }

                    var container = document.createElement('div');
                    var readingSpan = document.createElement('span');
                    readingSpan.appendChild(document.createTextNode(event.reading));
                    container.appendChild(readingSpan);

                    $q.all(promiseArray).then(function(results) {
                        if (results.length > 1 && results[1].length > 0) {
                            var range = getEventRange(event, results[1]);
                            readingSpan.style = "border-left:3px solid;border-color:" + range.color;
                        }
                    });
                    angular.element(element).append(container);
                }
            });
        };

        function getEventRange(event, ranges) {
            var resultRange = null;
            if (event && event.reading && event.unit && ranges && Array.isArray(ranges)) {
                var convertedReading = event.reading * event.unit.coefficient;
                ranges.forEach(function(range) {
                    if (convertedReading >= range.lowerLimit * range.unit.coefficient && convertedReading < range.upperLimit * range.unit.coefficient) {
                        resultRange = range;
                        return;
                    }
                });
            }
            return resultRange;
        }
        return {
            restrict: 'E', // only activate on element
            replace: true,
            scope: {
                event: '@blogluEvent'
            },
            link: linkFunction
        };
    }]);





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
                        dataviz = $compile('<table-dataviz config="config"></table-dataviz>')(scope);
                        break;
                    case 'chart':
                        dataviz = $compile('<chart-dataviz config="config"></chart-dataviz>')(scope);
                        break;
                    default:
                        //dataviz = $compile('<chart-dataviz dataviz-config="{{datavizConfig}}"></chart-dataviz>')(scope);
                        dataviz = $compile('<table-dataviz config="config"></table-dataviz>')(scope);
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
            config: '='
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
                angular.element(element).append(htmlElement);
            }
        }


        function buildSingleValueTable(scope) {
            var config = scope.config;
            var div = document.createElement('div');

            var title = document.createElement('h1');
            var value = document.createElement('span');

            title.appendChild(document.createTextNode(config.headers[0].title + ": "));
            value.appendChild(document.createTextNode(config.data[0][config.headers[0].name]));

            title.appendChild(value);
            div.appendChild(title);

            return div;
        }

        function buildMultipleValueTable(scope) {
            var table = document.createElement('table');
            table.className = 'table';
            scope.config.headers.forEach(function(header) {
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
                    scope.columnOrder.forEach(function(columnOrder) {
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

            scope.config.data.forEach(function(row) {
                var tr = document.createElement('tr');
                scope.config.headers.forEach(function(header) {
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
                this.scope.columnOrder.forEach(function(orderClause, index) {
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
                        sortClause.sort = dataService.sort[this.header.sort];
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



DirectivesModule.directive('chartDataviz', function($compile) {
    var linkFunction = function(scope, element, attrs) {
        scope.$watch('config', function(newValue, oldValue) {
            if (newValue && newValue !== oldValue) {
                var config = angular.fromJson(newValue);
                computeChartData(scope, config);
                if (angular.element(element).find('highchart').length) {
                    $compile(element)(scope);
                } else {
                    element.empty();
                    var chart = $compile('<highchart id="chart1" config="chartConfig" class="span10"></highchart>')(scope);
                }
                angular.element(element).append(chart);
            }
        });
    };

    function computeChartData(scope, config) {
        scope.chartConfig = {
            options: {
                chart: {
                    type: 'line',
                    zoomType: 'x'
                }
            },
            series: [],
            title: {
                text: ''
            },
            xAxis: {
                categories: []
                        /*
                         type: 'datetime',
                         dateTimeLabelFormats: {// don't display the dummy year
                         month: '%e. %b',
                         year: '%b'
                         }*/
            },
            loading: false
        };
        config.headers.forEach(function(queryElement) {
            if (queryElement.aggregate) {
                scope.chartConfig.series.push({name: queryElement.title, data: []});
            }
        });
        for (var lineIndex = 1; lineIndex < config.data.length; lineIndex++) {
            var textValue = '';
            for (var columnIndex = 0; columnIndex < config.headers.length; columnIndex++) {
                var propertyName = config.headers[columnIndex].title;
                if (config.headers[columnIndex].aggregate) {
                    var serie = getSerieByName(scope.chartConfig.series, propertyName);
                    serie.data.push(parseInt(config.data[lineIndex][propertyName]));
                } else {
                    textValue += " " + config.data[lineIndex][propertyName];
                }
            }
            scope.chartConfig.xAxis.categories.push(textValue);
        }
    }

    function getSerieByName(series, name) {
        var foundSerie = null;
        series.forEach(function(serie) {
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
            config: '='
        },
        link: linkFunction
    };
});







DirectivesModule.directive('equals', function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            if (!ngModel)
                return; // do nothing if no ng-model

            // watch own value and re-validate on change
            scope.$watch(attrs.ngModel, function() {
                validate();
            });

            // observe the other value and re-validate on change
            attrs.$observe('equals', function(val) {
                validate();
            });

            var validate = function() {
                // values
                var val1 = ngModel.$viewValue;
                var val2 = attrs.equals;

                // set validity
                ngModel.$setValidity('equals', val1 === val2);
            };
        }
    };
});





DirectivesModule.directive("test", function() {

    var directiveFunction = function(scope, element, attrs, ngModel) {


        var date = new Date();
        if (ngModel && ngModel.$modelValue && ngModel.$modelValue instanceof Date) {
            date = ngModel.$modelValue;
        }

        var hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        var minutes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59];

        var buildSelect = function(optionsTab) {
            var select = document.createElement("select");
            optionsTab.forEach(function(optionVal) {
                var option = document.createElement("option");
                option.value = optionVal;
                option.appendChild(document.createTextNode(optionVal));
                select.appendChild(option);
            });
            return select;
        };

        var hoursSelect = buildSelect(hours);
        var minutesSelect = buildSelect(minutes);

        angular.element(element).append(hoursSelect);
        angular.element(element).append(minutesSelect);


        hoursSelect.addEventListener("change", function hourChanged(eventInfo) {
            var newValue = hoursSelect.value;
            if (newValue !== date.getHours()) {
                date.setHours(newValue);
                ngModel.$setViewValue(date);
                ngModel.$render();
            }
        });

        minutesSelect.addEventListener("change", function minuteChanged(eventInfo) {
            var newValue = minutesSelect.value;
            if (newValue !== date.getMinutes()) {
                date.setMinutes(newValue);
                ngModel.$setViewValue(date);
                ngModel.$render();
            }
        });

        console.log("link");
    };



    return {
        restrict: 'E', // only activate on element
        // require: '?ngModel', // get a hold of NgModelController
        //link: directiveFunction,
        compile: function(element) {
            directiveFunction(null, element);

            return function(scope) {
                scope.world = 'World';
                //$compile()(scope);
            };
        }
    };
});


