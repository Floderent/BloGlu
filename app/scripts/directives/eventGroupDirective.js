var DirectivesModule = angular.module("BloGlu.directives");

DirectivesModule.directive('blogluEventGroup', ['$compile', '$injector', '$q','eventService','unitService', function ($compile, $injector, $q, eventService, unitService) {

        var resourceCode = $injector.get('ResourceCode');

        var linkFunction = function (scope, element, attrs) {
            var event = scope.blogluGroupedEvent;
            renderEvent(event, scope, element);
            scope.$watch('blogluGroupedEvent', function (newValue, oldValue) {
                if (newValue !== oldValue) {
                    element.html('');
                    renderEvent(newValue, scope, element);
                }
            }, true);
        };

        function renderEvent(event, scope, element) {

            //view reading by id
            var viewEvent = function (code, objectIds) {
                if (objectIds && objectIds.length > 0) {
                    eventService.viewEvent(code, objectIds[0]);
                }                
            };

            var template = getEventTemplate(event, resourceCode);
            var dom = angular.element(template);
            getScope(event, resourceCode).then(function (eventScope) {
                scope = angular.extend(scope, eventScope);
                scope.viewEvent = viewEvent;
                var compiled = $compile(dom);
                angular.element(element).append(dom);
                compiled(scope);
            });
        }

        function getEventTemplate(eventGroup, resourceCode) {
            var template = "";
            switch (eventGroup.code) {
                default:
                case resourceCode['bloodGlucose']:
                    template = '<div class="panel panel-default"><div class="panel-heading"><span class="glyphicon glyphicon-tint">{{title | translate}}</div><div class="panel-body"><p>{{"logBook.maximum" | translate}}: <a ng-click="viewEvent(code, maximumIds)">{{maximum}}</a> {{unit.name}}</p><p>{{"logBook.minimum"| translate}}: <a ng-click="viewEvent(code, minimumIds)">{{minimum}}</a> {{unit.name}}</p><p ng-style="{\'border-left\': border, \'border-color\': color}">{{"logBook.average"|translate}}: {{average}} {{unit.name}}</p><p>{{"logBook.number"|translate}}: {{number}}</p></div></div>';
                    break;
                case resourceCode['medication']:
                    template = '<div class="panel panel-default"><div class="panel-heading"><span class="glyphicon glyphicon-briefcase">{{title | translate}}</div><div class="panel-body"><p>{{"logBook.maximum" | translate}}: {{maximum}} {{unit.name}}</p><p>{{"logBook.minimum"| translate}}: {{minimum}} {{unit.name}}</p><p>{{"logBook.average"|translate}}: {{average}} {{unit.name}}</p><p>{{"logBook.number"|translate}}: {{number}}</p></div></div>';
                    break;
            }
            return template;
        }

        function getScope(event, resourceCode) {
            var scopePromise = null;
            switch (event.code) {
                default:
                case resourceCode['bloodGlucose']:
                    scopePromise = getBloodGlucoseScope(event, resourceCode);
                    break;
            }
            return scopePromise;
        }

        function getBloodGlucoseScope(event, resourceCode) {
            var scope = {};
            var dataService = $injector.get('dataService');
            var userService = $injector.get('UserService');            
            
            var promiseArray = [dataService.queryLocal('Unit', {where: {code: event.code}}), dataService.queryLocal('Range'), userService.getDefaultUnit(resourceCode[event.code])];
            return $q.all(promiseArray).then(function (results) {
                var units = results[0];
                var defaultUnit = results[2];
                
                var unit = null;
                if (defaultUnit && event.code === resourceCode['bloodGlucose']) {
                    unit = defaultUnit;
                } else {
                    unit = unitService.getReferenceUnit(units);
                }
                var range = eventService.getEventRange(event.average, unitService.getReferenceUnit(units), results[1]);

                scope.unit = unit;
                scope.code = event.code;
                scope.title = event.title;

                scope.number = event.number;

                scope.average = getConvertedReading(event.average, unit, unitService.getReferenceUnit(units));
                scope.minimum = getConvertedReading(event.minimum, unit, unitService.getReferenceUnit(units));
                scope.maximum = getConvertedReading(event.maximum, unit, unitService.getReferenceUnit(units));

                scope.minimumIds = event.minimumIds;
                scope.maximumIds = event.maximumIds;

                if (range) {
                    scope.color = range.color;
                    scope.border = "5px solid";
                }
                return scope;
            });
        }

        function getConvertedReading(reading, defaultUnit, referenceUnit) {
            if (defaultUnit && referenceUnit) {
                reading = reading * referenceUnit.coefficient / defaultUnit.coefficient;
            }
            return reading;
        }
        
        return {
            restrict: 'E', // only activate on element
            replace: true,
            scope: {
                blogluGroupedEvent: '='
            },
            link: linkFunction
        };
    }]);


