var DirectivesModule = angular.module("BloGlu.directives");


DirectivesModule.directive('dataviz', function() {
    var directiveFunction = function(scope, element, attrs, ngModel) {
        //build DOM

    };
    return {
        restrict: 'E', // only activate on element
        replace: true,
        scope: {
            config: '@datavizConfig'
        },
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



DirectivesModule.directive('tableDataviz', function() {
    var compileFunction = function(scope, element, attrs, ngModel) {
        //build DOM
    };

    var linkFunction = function(scope, element, attrs) {        
        scope.$watch('config', function(newValue, oldValue) {            
            element.empty();
            if (newValue) {
                var config = angular.fromJson(newValue);
                var htmlElement = null;
                if (config && config.data) {
                    if (config.headers && config.headers.length === 1 && config.data && config.data.length === 1) {
                        htmlElement = buildSingleValueTable(config);
                    } else {
                        htmlElement = buildMultipleValueTable(config);
                    }
                }
                angular.element(element).append(htmlElement);
            }
        });
    };

    function buildSingleValueTable(config) {
        var div = document.createElement('div');
        
        var title = document.createElement('h1');
        var value = document.createElement('span');
        
        title.appendChild(document.createTextNode(config.headers[0].title + ": "));
        value.appendChild(document.createTextNode(config.data[0][config.headers[0].title]));
        
        title.appendChild(value);
        div.appendChild(title);
        
        return div;
    }

    function buildMultipleValueTable(config) {
        var table = document.createElement('table');
        table.className = 'table';
        config.headers.forEach(function(header) {
            var th = document.createElement('th');
            th.appendChild(document.createTextNode(header.title));
            table.appendChild(th);
        });
        config.data.forEach(function(row) {
            var tr = document.createElement('tr');
            config.headers.forEach(function(header) {
                var td = document.createElement('td');
                td.appendChild(document.createTextNode(row[header.title]));
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
        return table;
    }

    return {
        restrict: 'E', // only activate on element
        replace: true,
        scope: {
            config: '@datavizConfig'
        },
        link: linkFunction/*,
         compile: function(element) {
         compileFunction(null, element);
         return function(scope) {
         $compile()(scope);
         };
         }*/
    };
});



DirectivesModule.directive('chartDataviz', function() {
    var compileFunction = function(scope, element, attrs, ngModel) {
        //build DOM
    };

    var linkFunction = function(scope, element, attrs) {        
        scope.$watch('config', function(newValue, oldValue) {            
            element.empty();
            if (newValue) {
                var config = angular.fromJson(newValue);                
                //<highchart id="chart1" config="chartConfig" class="span10"></highchart>
                var chartTag = document.createElement('highchart');
                chartTag.config = 'chartConfig';
                
                angular.element(element).append(chartTag);
            }
        });
    };

    function computeChartData(scope, config){
        
        
    }

    return {
        restrict: 'E', // only activate on element
        replace: true,
        scope: {
            config: '@datavizConfig'
        },
        link: linkFunction/*,
         compile: function(element) {
         compileFunction(null, element);
         return function(scope) {
         $compile()(scope);
         };
         }*/
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

        debugger;

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


