var DirectivesModule = angular.module("BloGlu.directives");


DirectivesModule.directive('blogluEvent', ['$compile', '$injector', '$q', '$location', function($compile, $injector, $q, $location, ResourceCode) {
        var linkFunction = function(scope, element, attrs) {
            scope.$watch('event', function(newValue, oldValue) {

                //view reading by id
                var viewEvent = function(resource, objectId) {
                    var path = 'event/' + resource + "/" + objectId;
                    $location.path(path);
                };

                //if (newValue && newValue !== oldValue) 
                {
                    var event = angular.fromJson(newValue);
                    var dataService = $injector.get('dataService');
                    var resourceCode = $injector.get('ResourceCode');
                    var userService = $injector.get('UserService');

                    var promiseArray = [dataService.queryLocal('Unit', {where: {code: event.code}})];

                    if (event.code === resourceCode['bloodGlucose']) {
                        promiseArray.push(dataService.queryLocal('Range'));
                    }
                    var dom = angular.element
                            (/*
                            '<div ng-dblclick="viewEvent(resource, objectId)" style="border-left:3px solid;border-color:{{color}};">\n\
                                <span style="margin-left:5px;">{{reading}} {{unit.name}}</span>\n\
                            </div>'
                               */
                             
                            '<div ng-dblclick="viewEvent(resource, objectId)" class="panel panel-default"><div style="border-left:5px solid;border-color:{{color}};" class="panel-body">{{reading}} {{unit.name}}</div></div>'
                            
                            );
                    $q.all(promiseArray).then(function(results) {
                        var range = getEventRange(event, results[1]);
                        var unit = null;
                        var reading = event.reading;
                        if (userService.preferences && userService.preferences.defaultUnit) {
                            unit = userService.preferences.defaultUnit;
                            reading = reading * event.unit.coefficient / unit.coefficient;
                        } else {
                            unit = event.unit;
                        }
                        scope.reading = reading;
                        scope.unit = unit;
                        scope.resource = resourceCode[event.code];
                        scope.viewEvent = viewEvent;
                        scope.objectId = event.objectId;
                        
                        if (range) {
                            scope.color = range.color;
                        }
                        var compiled = $compile(dom);

                        angular.element(element).append(dom);

                        compiled(scope);
                    });

                }
            });
        };


        function getEventRange(event, ranges) {
            var resultRange = null;
            if (event && event.reading && event.unit && ranges && Array.isArray(ranges)) {
                var convertedReading = event.reading * event.unit.coefficient;
                angular.forEach(ranges, function(range) {
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
