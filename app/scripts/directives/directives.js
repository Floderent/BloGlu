var DirectivesModule = angular.module("BloGlu.directives", []);

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


