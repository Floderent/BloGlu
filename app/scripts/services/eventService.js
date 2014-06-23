'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('eventService', ['$q', 'dataService', 'queryService', 'genericDaoService', function($q, dataService, queryService, genericDaoService) {
        
        
        var eventService = {};
        var resourceName = 'Event';
        
        eventService.getEvent = function(eventId){
            return genericDaoService.get(resourceName, eventId);
        };
        
        eventService.saveEvent = function(event, isEdit){
            return genericDaoService.save(resourceName, event, isEdit);
        };
        
        eventService.deleteEvent = function(event){
            return genericDaoService.delete(resourceName, event);
        };
        
        
        return eventService;
    }]);