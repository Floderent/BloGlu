'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('eventService', ['genericDaoService', 'ResourceCode', function(genericDaoService, ResourceCode) {


        var eventService = {};
        var resourceName = 'Event';

        eventService.getEvent = function(eventId) {
            return genericDaoService.get(resourceName, eventId);
        };

        eventService.saveEvent = function(event, isEdit) {
            return genericDaoService.save(resourceName, event, isEdit);
        };

        eventService.deleteEvent = function(event) {
            return genericDaoService.delete(resourceName, event);
        };

        eventService.resolveCreationMessage = function(eventCode) {
            return eventService.resolveMessage(eventCode, true);
        };

        eventService.resolveUpdateMessage = function(eventCode) {
            return eventService.resolveMessage(eventCode);
        };

        eventService.resolveMessage = function(eventCode, isCreation) {
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



        return eventService;
    }]);