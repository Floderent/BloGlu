'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.service('genericDaoService', ['dataService', function(dataService) {

        var genericDaoService  ={};

        genericDaoService.delete = function(resourceName, object) {
            var objectId = null;
            if (object && object.objectId) {
                objectId = object.objectId;
            } else {
                objectId = object;
            }
            return dataService.delete(resourceName, objectId);
        };
        genericDaoService.getAll = function(resourceName) {
            return dataService.queryLocal(resourceName);
        };
        
        genericDaoService.save = function(resourceName, data, isEdit){
            var savingPromise = null;
            if (isEdit) {
                savingPromise = dataService.update(resourceName, data.objectId, data);
            } else {
                savingPromise = dataService.save(resourceName, data);
            }
            return savingPromise;
        };
        
        genericDaoService.get = function(resourceName, objectId){            
            return dataService.queryLocal(resourceName, {where: {objectId: objectId}}).then(function(result) {
                var report = {};
                if (result && result.length === 1) {
                    report = result[0];
                }
                return report;
            });
        };
        genericDaoService.delete = function(resourceName, object){
            var objectId = null;
            if (object && object.objectId) {
                objectId = object.objectId;
            } else {
                objectId = object;
            }
            return dataService.delete(resourceName, objectId);
        };


        return genericDaoService;
    }]);
