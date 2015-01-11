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
                scope.beginDate = event.beginDate;
                scope.endDate = event.endDate;
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
                    template = '<div class="panel panel-primary">'+
                                    '<div class="panel-heading">'+
                                        '<span class="glyphicon glyphicon-tint"></span> {{title | translate}}'+
                                    '</div>'+
                                    '<div class="panel-body">'+
                                        '<p><button type="button" ng-style="{\'border-left\': border, \'border-color\': color}" class="btn btn-default">{{"logBook.average" | translate}} <span class="reading">{{average}}</span> {{unit.name}}</button></p>'+
                                        '<p><button type="button" class="btn btn-default" ng-click="viewEvent(code, maximumIds)">{{"logBook.maximum" | translate}} <span class="reading">{{maximum}}</span> {{unit.name}}</button></p>'+
                                        '<p><button type="button" class="btn btn-default" ng-click="viewEvent(code, minimumIds)">{{"logBook.minimum" | translate}} <span class="reading">{{minimum}}</span> {{unit.name}}</button></p>'+                                        
                                        '<p><button type="button" class="btn btn-default">{{"logBook.number" | translate}} <span class="reading">{{number}}</span></button></p>'+
                                        '<p><button type="button" class="btn btn-primary pull-right" ng-click="blogluGroupedEventZoomInInterval({date:beginDate})">{{"logBook.viewDetails" | translate}}</button></p>'+
                                    '</div>'+
                                '</div>'; 
                    break;
                case resourceCode['medication']:
                    template = '<div class="panel panel-primary">'+
                                    '<div class="panel-heading">'+
                                        '<span class="glyphicon glyphicon-briefcase"></span> {{title | translate}}'+
                                    '</div>'+
                                    '<div class="panel-body">'+
                                        //'<p><button type="button" class="btn btn-default">{{"logBook.average" | translate}} <span class="reading">{{average}}</span> {{unit.name}}</button></p>'+
                                        '<p><button type="button" class="btn btn-default">{{"logBook.maximum" | translate}} <span class="reading">{{maximum}}</span> {{unit.name}}</button></p>'+
                                        '<p><button type="button" class="btn btn-default">{{"logBook.minimum" | translate}} <span class="reading">{{minimum}}</span> {{unit.name}}</button></p>'+
                                        '<p><button type="button" class="btn btn-default">{{"logBook.total" | translate}} <span class="reading">{{total}}</span> {{unit.name}}</button></p>'+
                                        '<p><button type="button" class="btn btn-default">{{"logBook.number" | translate}} <span class="reading">{{number}}</span></button></p>'+
                                        '<p><button type="button" class="btn btn-primary pull-right" ng-click="blogluGroupedEventZoomInInterval({date:beginDate})">{{"logBook.viewDetails" | translate}}</button></p>'+
                                    '</div>'+
                                '</div>';
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
                scope.total = event.total;

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
                blogluGroupedEvent: '=',                
                blogluGroupedEventZoomInInterval: '&'
            },
            link: linkFunction
        };
    }]);


