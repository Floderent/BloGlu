'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('queryService', ['$q', 'dataService', 'ModelUtil', function($q, dataService, ModelUtil) {
        var queryService = {};
        
        queryService.getMetadatamodel = function(){
            return dataService.queryLocal('Metadatamodel');
        };        
        
        queryService.getMeasures = function() {
            var measures = [];
            return dataService.queryLocal('Metadatamodel').then(function(mdm) {
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
            return dataService.queryLocal('Metadatamodel').then(function(mdm) {
                angular.forEach(mdm, function(mdmElement) {
                    if (!mdmElement.aggregate) {
                        levels.push(mdmElement);
                    }
                });
                return levels;
            });
        };

        queryService.getFilters = function() {
            return dataService.where;
        };

        return queryService;
    }]);