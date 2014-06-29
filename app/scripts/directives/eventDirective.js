var DirectivesModule = angular.module("BloGlu.directives");


DirectivesModule.directive('blogluEvent', ['$compile', '$injector', '$q', '$location', function($compile, $injector, $q, $location) {
        var linkFunction = function(scope, element, attrs) {                
            var event = scope.blogluEvent;            
            renderEvent(event, scope, element);
           
            scope.$watch('blogluEvent', function(newValue, oldValue){                 
                if(newValue !== oldValue){
                    element.html('');
                    renderEvent(newValue, scope, element);
                }
            },true);           
        };

        function renderEvent(event, scope, element) {
            
            var resourceCode = $injector.get('ResourceCode');

            //view reading by id
            var viewEvent = function(code, objectId) {
                var resource = resourceCode[code];
                var path = 'event/' + resource + "/" + objectId;
                $location.path(path);
            };

            var template = getEventTemplate(event, resourceCode);
            var dom = angular.element('<div ng-dblclick="viewEvent(code, objectId)" class="panel panel-default">' + template + '</div>');

            getScope(event, resourceCode).then(function(eventScope) {
                scope = angular.extend(scope, eventScope);
                scope.viewEvent = viewEvent;
                var compiled = $compile(dom);
                angular.element(element).append(dom);
                compiled(scope);
            });
        }



        function getEventTemplate(event, resourceCode) {
            var template = "";
            switch (event.code) {
                case resourceCode['bloodGlucose']:
                    template = '<div style="border-left:5px solid;border-color:{{color}};" class="panel-body"><span class="glyphicon glyphicon-tint"></span>{{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span class="reading"> {{unit.name}}</div>';
                    break;
                case resourceCode['medication']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-briefcase"></span>{{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> {{unit.name}}</div>';
                    break;
            }
            return template;
        }

        function getScope(event, resourceCode) {
            var scopePromise = null;
            switch (event.code) {
                case resourceCode['bloodGlucose']:
                    scopePromise = getBloodGlucoseScope(event);
                    break;
                default:
                    scopePromise = getDefaultScope(event);
                    break;
            }
            return scopePromise;
        }


        function getBloodGlucoseScope(event) {
            var scope = {};
            var dataService = $injector.get('dataService');
            var resourceCode = $injector.get('ResourceCode');
            var userService = $injector.get('UserService');
            var promiseArray = [dataService.queryLocal('Unit', {where: {code: event.code}}), dataService.queryLocal('Range')];
            return $q.all(promiseArray).then(function(results) {
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
                scope.code = event.code;
                scope.objectId = event.objectId;
                scope.dateTime = event.dateTime;

                if (range) {
                    scope.color = range.color;
                }
                return scope;
            });
        }

        function getDefaultScope(event) {
            var deferred = $q.defer();
            deferred.resolve(event);
            return deferred.promise;
        }



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
                blogluEvent: '='
            },
            link: linkFunction
        };
    }]);
