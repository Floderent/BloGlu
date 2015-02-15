'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('queryService', ['$q', 'dataService', 'ModelUtil', 'localizationService', function($q, dataService, ModelUtil, localizationService) {
        var queryService = {};
        
        var resourceName = 'Metadatamodel';
        
        queryService.getMetadatamodel = function() {            
            return dataService.queryLocal(resourceName);            
        };
        
        queryService.getMeasures = function() {
            var measures = [];
            return dataService.queryLocal(resourceName).then(function(mdm) {
                angular.forEach(mdm, function(mdmElement) {                   
                    if (mdmElement.aggregate) {
                        measures.push(mdmElement);
                    }
                });
                return measures;
            });
        };

        queryService.getLevels = function() {
            var levels = [];
            return dataService.queryLocal(resourceName).then(function(mdm) {
                angular.forEach(mdm, function(mdmElement) {                    
                    if (!mdmElement.aggregate) {
                        levels.push(mdmElement);
                    }
                });
                return levels;
            });
        };

        queryService.getFilters = function() {
            var result = [];
            angular.forEach(dataService.where, function(whereElement) {                
                result.push(whereElement);
            });
            return result;
        };
        
        return queryService;
    }]);