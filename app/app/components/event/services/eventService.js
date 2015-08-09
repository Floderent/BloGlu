(function () {
    'use strict';    

    angular
            .module('bloglu.event')
            .factory('eventService', eventService);

    eventService.$inject = ['$state', '$modal', '$q', '$rootScope', 'logBookService', 'genericDaoService', 'ResourceCode'];

    function eventService($state, $modal, $q, $rootScope, logBookService, genericDaoService, ResourceCode) {


        var eventService = {};
        var resourceName = 'Event';

        eventService.getEvent = function (eventId) {
            return genericDaoService.get(resourceName, eventId);
        };

        eventService.saveEvent = function (event, isEdit) {
            return genericDaoService.save(resourceName, event, isEdit);
        };

        eventService.deleteEvent = function (event) {
            return genericDaoService.remove(resourceName, event);
        };

        eventService.resolveCreationMessage = function (eventCode) {
            return eventService.resolveMessage(eventCode, true);
        };

        eventService.resolveUpdateMessage = function (eventCode) {
            return eventService.resolveMessage(eventCode);
        };

        eventService.resolveMessage = function (eventCode, isCreation) {
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
        };


        eventService.goToAddEvent = function (eventCode, day, period, newPage) {
            var deferred = $q.defer();            
            var newEventDate = logBookService.getMiddleTime(period);
            if (newPage) {
                $state.go('event', {eventType: ResourceCode[eventCode],day: day.date.toISOString(), time: newEventDate.toISOString()});                
                deferred.resolve();
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
                modalInstance.result.then(deferred.resolve, deferred.reject);
            }
            return deferred.promise;
        };


        eventService.viewEvent = function (eventCode, eventId, newPage) {
            var deferred = $q.defer();
            var resource = ResourceCode[eventCode];
            if (newPage) {                
                $state.go('event', {eventType: resource,objectId: eventId})                
                deferred.resolve();
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
                modalInstance.result.then(deferred.resolve, deferred.reject);
            }
            return deferred.promise;
        };
        eventService.getEventRange = function (reading, unit, ranges) {
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
        };

        return eventService;
    }
})();