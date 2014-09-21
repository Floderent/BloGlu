var DirectivesModule = angular.module("BloGlu.directives");

DirectivesModule.directive('blogluEventGroup', ['$compile', '$injector', '$q', function($compile, $injector, $q) {
        var linkFunction = function(scope, element, attrs) {                
            var event = scope.blogluGroupedEvent;            
            renderEvent(event, scope, element);           
            scope.$watch('blogluGroupedEvent', function(newValue, oldValue){                 
                if(newValue !== oldValue){
                    element.html('');
                    renderEvent(newValue, scope, element);
                }
            },true);           
        };
        function renderEvent(event, scope, element) {
            
            var resourceCode = $injector.get('ResourceCode');
            
            var template = getEventTemplate(event, resourceCode);
            var dom = angular.element(template);
            getScope(event, resourceCode).then(function(eventScope) {
                scope = angular.extend(scope, eventScope);                
                var compiled = $compile(dom);
                angular.element(element).append(dom);
                compiled(scope);
            });
        }

        function getEventTemplate(eventGroup, resourceCode) {
            var template = "";              
            switch(eventGroup.code){
                default:
                case resourceCode['bloodGlucose']:
                    template = '<div class="panel panel-default"><div class="panel-heading"><span class="glyphicon glyphicon-tint">{{title | translate}}</div><div class="panel-body"><p>{{"logBook.maximum" | translate}}: {{maximum}} {{unit.name}}</p><p>{{"logBook.minimum"| translate}}: {{minimum}} {{unit.name}}</p><p ng-style="{\'border-left\': border, \'border-color\': color}">{{"logBook.average"|translate}}: {{average}} {{unit.name}}</p><p>{{"logBook.number"|translate}}: {{number}}</p></div></div>';
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
        
        function getBloodGlucoseScope(event, resourceCode){            
            var scope = {};
            var dataService = $injector.get('dataService');
            var userService = $injector.get('UserService');
            var promiseArray = [dataService.queryLocal('Unit', {where: {code: event.code}}), dataService.queryLocal('Range')];
            return $q.all(promiseArray).then(function(results) {                
                var units = results[0];
                var unit = null;                
                if (userService.currentUser().preferences && userService.currentUser().preferences.defaultUnit && event.code === resourceCode['bloodGlucose']) {
                    unit = userService.currentUser().preferences.defaultUnit;                    
                } else {
                    unit = getReferenceUnit(units);
                }                
                var range = getEventRange(event.average, getReferenceUnit(units), results[1]);
                
                scope.unit = unit;
                scope.code = event.code;
                scope.title = event.title;
                
                scope.number = event.number;
                
                scope.average = getConvertedReading(event.average, unit, getReferenceUnit(units));
                scope.minimum = getConvertedReading(event.minimum, unit, getReferenceUnit(units));
                scope.maximum = getConvertedReading(event.maximum, unit, getReferenceUnit(units));
                
                if (range) {                    
                    scope.color = range.color;
                    scope.border = "5px solid";                    
                }
                return scope;
            });
        }
        
        function getConvertedReading(reading, defaultUnit, referenceUnit){            
            if(defaultUnit && referenceUnit){
                reading = reading * referenceUnit.coefficient / defaultUnit.coefficient;
            }
            return reading;
        }
        
        function getEventRange(reading, unit, ranges) {
            var resultRange = null;
            if (reading && unit && ranges && Array.isArray(ranges)) {
                var convertedReading = reading * unit.coefficient;
                angular.forEach(ranges, function(range) {
                    if (convertedReading >= range.lowerLimit * range.unit.coefficient && convertedReading < range.upperLimit * range.unit.coefficient) {
                        resultRange = range;
                        return;
                    }
                });
            }
            return resultRange;
        }
        
        function getReferenceUnit(units){            
            var referenceUnit = null;
            if(units){
                angular.forEach(units, function(unit){
                   if(unit.coefficient === 1){
                       referenceUnit = unit;
                       return;
                   }                    
                });
            }            
            return referenceUnit;
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


