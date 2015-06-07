(function () {
    'use strict';

    angular.module('bloglu.datavizDirective').directive('dataviz', dataviz);

    dataviz.$inject = ['$compile'];

    function dataviz($compile) {
        var linkFunction = function (scope, element, attrs) {
            scope.$watch('config', function (newValue, oldValue) {
                element.empty();
                //if (newValue) {
                var config = angular.fromJson(scope.config);
                if (config) {
                    scope.datavizConfig = config;
                    var dataviz = null;
                    switch (config.type) {
                        case 'table':
                            dataviz = $compile('<table-dataviz column-order="columnOrder" config="config"></table-dataviz>')(scope);
                            break;
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

                //}
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
    }    

})();