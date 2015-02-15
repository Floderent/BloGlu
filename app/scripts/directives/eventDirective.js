var DirectivesModule = angular.module("BloGlu.directives");


DirectivesModule.directive('blogluEvent', ['$compile', '$injector', '$q', 'eventService', function ($compile, $injector, $q, eventService) {
        var linkFunction = function (scope, element, attrs) {
            var event = scope.blogluEvent;
            renderEvent(event, scope, element);
            /*
             scope.$watch('blogluEvent', function (newValue, oldValue) {
             if (newValue !== oldValue) {
             element.html('');
             renderEvent(newValue, scope, element);
             }
             }, true);
             */
        };

        function renderEvent(event, scope, element) {

            var resourceCode = $injector.get('ResourceCode');
            var template = getEventTemplate(event, resourceCode);
            var dom = angular.element('<div ng-click="clickAction({code: code, objectId: objectId})" class="panel panel-default">' + template + '</div>');

            getScope(event, resourceCode).then(function (eventScope) {
                scope = angular.extend(scope, eventScope);
                var compiled = $compile(dom);
                angular.element(element).append(dom);
                compiled(scope);
            });
        }

        function getEventTemplate(event, resourceCode) {
            var template = "";
            switch (event.code) {
                case resourceCode['other']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-tag"></span> {{dateTime | date:"HH:mm"}} <span>{{comment}}</span> {{category.name}}</div>';
                    break;
                case resourceCode['bloodGlucose']:
                    template = '<div ng-style="{\'border-left\': border, \'border-color\': color}"  class="panel-body"><span class="glyphicon glyphicon-tint"></span> {{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span class="reading"> {{unit.name}}</div>';
                    break;
                case resourceCode['medication']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-briefcase"></span> {{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> {{unit.name}}</div>';
                    break;
                case resourceCode['weight']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-dashboard"></span> {{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> {{unit.name}}</div>';
                    break;
                case resourceCode['bloodPressure']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-heart"></span> {{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> / <span class="reading">{{diastolic}}</span> {{unit.name}}</div>';
                    break;
                case resourceCode['a1c']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-file"></span> {{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> {{unit.name}}</div>';
                    break;
                case resourceCode['exercise']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-flash"></span> {{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> {{unit.name}}</div>';
                    break;
                case resourceCode['foodIntake']:
                    template = '<div class="panel-body"><span class="glyphicon glyphicon-cutlery"></span> {{dateTime | date:"HH:mm"}} <span class="reading">{{reading}}</span> {{unit.name}}</div>';
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

            var promiseArray = [
                dataService.queryLocal('Range'),
                userService.getDefaultUnit(resourceCode[event.code])
            ];
            return $q.all(promiseArray).then(function (results) {
                var unit = null;
                var defaultUnit = results[1];

                var reading = event.reading;
                if (defaultUnit) {
                    unit = defaultUnit;
                    reading = reading * event.unit.coefficient / unit.coefficient;
                } else {
                    unit = event.unit;
                }
                var range = eventService.getEventRange(reading, unit, results[0]);
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
                blogluEvent: '=',
                clickAction: '&'
            },
            link: linkFunction
        };
    }]);
