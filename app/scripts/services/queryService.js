'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('queryService', ['$q', 'dataService', 'ModelUtil', 'localizationService', function($q, dataService, ModelUtil, localizationService) {
        var queryService = {};

        queryService.getMetadatamodel = function() {            
            var mdmPromise = dataService.queryLocal('Metadatamodel').then(function(mdm){
                var translatedMdm = [];
                angular.forEach(mdm, function(mdmElement){
                    translatedMdm.push(translateElement(mdmElement));
                });
                return translatedMdm;
            });
            return mdmPromise;
        };
        
        queryService.getMeasures = function() {
            var measures = [];
            return dataService.queryLocal('Metadatamodel').then(function(mdm) {
                angular.forEach(mdm, function(mdmElement) {                   
                    if (mdmElement.aggregate) {
                        measures.push(translateElement(mdmElement));
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
                        levels.push(translateElement(mdmElement));
                    }
                });
                return levels;
            });
        };

        queryService.getFilters = function() {
            var result = {};
            angular.forEach(dataService.where, function(whereElement, key) {                
                result[key] = translateElement(whereElement);
            });
            return result;
        };
        
        function translateElement(element){
            if(element.title){
                element.title = localizationService.get(element.title);
            }
            if(element.group){                
                element.group = localizationService.get(element.group);
            }
            return element;
        }
        
        
        return queryService;
    }]);