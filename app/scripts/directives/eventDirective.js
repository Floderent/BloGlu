var DirectivesModule = angular.module("BloGlu.directives");


DirectivesModule.directive('blogluEvent', ['$compile', '$injector', '$q','eventService', function($compile, $injector, $q, eventService) {
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
                eventService.viewEvent(code, objectId);
            };
            var template = getEventTemplate(event, resourceCode);
            var dom = angular.element('<div ng-click="viewEvent(code, objectId)" class="panel panel-default">' + template + '</div>');

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
                    template = '<div ng-style="{\'border-left\': border, \'border-color\': color}"  class="panel-body"><span class="glyphicon glyphicon-tint"></span>{{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span class="reading"> {{unit.name}}</div>';
                    break;
                case resourceCode['medication']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-briefcase"></span>{{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> {{unit.name}}</div>';
                    break;
                case resourceCode['weight']:
                    
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
            var userService = $injector.get('UserService');
            var resourceCode = $injector.get('ResourceCode');
            
            var promiseArray = [dataService.queryLocal('Unit', {where: {code: event.code}}), dataService.queryLocal('Range'), userService.getDefaultUnit(resourceCode[event.code])];
            return $q.all(promiseArray).then(function(results) {                
                var unit = null;
                var defaultUnit = results[2]
                
                var reading = event.reading;
                if (defaultUnit) {
                    unit = defaultUnit;
                    reading = reading * event.unit.coefficient / unit.coefficient;
                } else {
                    unit = event.unit;
                }
                var range = eventService.getEventRange(reading, unit, results[1]);                
                scope.reading = reading;
                scope.unit = unit;                
                scope.code = event.code;
                scope.objectId = event.objectId;
                scope.dateTime = event.dateTime;
                
                if (range) {                    
                    scope.color = range.color;
                    scope.border = "5px solid";                    
                }
                return scope;
            });
        }

        function getDefaultScope(event) {
            var deferred = $q.defer();
            deferred.resolve(event);
            return deferred.promise;
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
