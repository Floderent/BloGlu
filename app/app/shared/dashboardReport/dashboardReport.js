(function () {
'use strict';

angular.module('bloglu.dashboardReport')
    .directive('dashboardReport', function($compile) {
    var linkFunction = function(scope, element, attrs) {        
        var reportConfig = scope.reportConfig;
        renderReport(reportConfig, element);

        scope.$watch('reportConfig', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                element.html('');
                renderReport(newValue, element);
            }
        }, true);
    };

    function renderReport(reportConfig, element) {
        var template = getTemplate(reportConfig);
        var dom = angular.element(template);
        var compiled = $compile(dom);
        angular.element(element).append(dom);
        compiled(reportConfig);
    }


    function getTemplate(reportConfig) {
        var template = '';//'<button type="button" class="btn btn-primary" ng-click="chooseReport(reportTab.indexOf(line), $index)">{{ \'dashboard.addnewReport\' | translate }}</button>';

        if (reportConfig && reportConfig.queryResult && reportConfig.queryResult.data && reportConfig.queryResult.headers) {
            template = '<a href="" ng-click="clearReport(reportTab.indexOf(line), $index)" class="glyphicon glyphicon-remove-circle pull-right"></a><dataviz config="queryResult" column-order="columnOrder"></dataviz>';
        } else {
            if (reportConfig && reportConfig.loading) {
                template = '<img alt="loading" src="assets/images/spinner.gif" />';
            } else {
                template = '<button type="button" class="btn btn-primary" ng-click="chooseReport(reportTab.indexOf(line), $index)">{{ \'dashboard.addnewReport\' | translate }}</button>';
            }
        }
        return template;
    }

    return {
        restrict: 'E', // only activate on element
        replace: true,
        scope: {
            reportConfig: '='
        },
        link: linkFunction
    };
});
})();

