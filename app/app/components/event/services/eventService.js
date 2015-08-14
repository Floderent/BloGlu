(function () {
    'use strict';

    angular.module('bloglu.event')
           .factory('eventService', eventService);

    eventService.$inject = ['$state', '$modal', '$q', '$rootScope', 'logBookService', 'genericDaoService', 'ResourceCode'];

    function eventService($state, $modal, $q, $rootScope, logBookService, genericDaoService, ResourceCode) {

        var resourceName = 'Event';

        var eventService = {
            getEvent: getEvent,
            saveEvent: saveEvent,
            deleteEvent: deleteEvent,
            resolveCreationMessage: resolveCreationMessage,
            resolveUpdateMessage: resolveUpdateMessage,
            resolveMessage: resolveMessage,
            goToAddEvent: goToAddEvent,
            viewEvent: viewEvent,
            getEventRange: getEventRange
        };
        return eventService;

        function getEvent(eventId) {
            return genericDaoService.get(resourceName, eventId);
        }

        function saveEvent(event, isEdit) {
            return genericDaoService.save(resourceName, event, isEdit);
        }

        function deleteEvent(event) {
            return genericDaoService.remove(resourceName, event);
        }

        function resolveCreationMessage(eventCode) {
            return eventService.resolveMessage(eventCode, true);
        }

        function resolveUpdateMessage(eventCode) {
            return eventService.resolveMessage(eventCode);
        }

        function resolveMessage(eventCode, isCreation) {
            var message = "";
            var messagePrefix = "successMessage.";
            var messageSuffix = "Updated";
            if (isCreation) {
                messageSuffix = "Created";
            }
            if (ResourceCode[eventCode]) {
                message = messagePrefix + ResourceCode[eventCode] + messageSuffix;
            }
            return message;
        }


        function goToAddEvent(eventCode, day, period, newPage) {
            return $q(function (resolve, reject) {
                var newEventDate = logBookService.getMiddleTime(period);
                if (newPage) {
                    $state.go('event', {eventType: ResourceCode[eventCode], day: day.date.toISOString(), time: newEventDate.toISOString()});
                    resolve();
                } else {
                    var $modalScope = $rootScope.$new(true);
                    $modalScope.eventType = ResourceCode[eventCode];
                    $modalScope.day = day.date.toISOString();
                    $modalScope.time = newEventDate.toISOString();
                    $modalScope.windowMode = 'MODAL';
                    var modalInstance = $modal.open({
                        templateUrl: "app/components/event/templates/event.html",
                        controller: "eventController as vm",
                        scope: $modalScope
                    });
                    modalInstance.result.then(resolve, reject);
                }
            });
        }


        function viewEvent(eventCode, eventId, newPage) {
            return $q(function (resolve, reject) {
                var resource = ResourceCode[eventCode];
                if (newPage) {
                    $state.go('event', {eventType: resource, objectId: eventId});
                    resolve();
                } else {
                    var $modalScope = $rootScope.$new(true);
                    $modalScope.eventType = ResourceCode[eventCode];
                    $modalScope.objectId = eventId;
                    $modalScope.windowMode = 'MODAL';

                    var modalInstance = $modal.open({
                        templateUrl: "app/components/event/templates/event.html",
                        controller: "eventController as vm",
                        scope: $modalScope
                    });
                    modalInstance.result.then(resolve, reject);
                }
            });
        }

        function getEventRange(reading, unit, ranges) {
            var resultRange = null;
            if (reading && unit && ranges && Array.isArray(ranges)) {
                var convertedReading = reading * unit.coefficient;
                angular.forEach(ranges, function (range) {
                    if (convertedReading >= range.lowerLimit * range.unit.coefficient && convertedReading < range.upperLimit * range.unit.coefficient) {
                        resultRange = range;
                        return;
                    }
                });
            }
            return resultRange;
        }


    }
})();
