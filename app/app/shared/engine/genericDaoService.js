(function () {
'use strict';

angular.module('bloglu.engine')
            .factory('genericDaoService', genericDaoService);

genericDaoService.$inject = ['dataService'];

function genericDaoService(dataService) {

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
                var objectId = data.objectId;
                savingPromise = dataService.update(resourceName, objectId, data);
            } else {                
                savingPromise = dataService.save(resourceName, data);
            }
            return savingPromise;
        };
        
        genericDaoService.get = function(resourceName, objectId){            
            return dataService.get(resourceName, objectId).then(function(result) {
                return result;
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
    }
})();
