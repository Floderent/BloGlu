'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('unitService', ['$q','dataService', 'UserService','ResourceCode', function($q,dataService, UserService, ResourceCode) {

    var unitService = {};
    var resourceName = 'Unit';

    unitService.getUnitsByCode = function(code){
      return dataService.queryLocal(resourceName, {where: {code: code}});
    };    
    
    unitService.getReferenceUnitByCode = function(code){
        return dataService.queryLocal(resourceName, {where: {code: code, coefficient: 1}}).then(function(results){
            if(results && results.length >= 1){
                return results[0];
            }
            return results;
        });
    };
    
    
    unitService.getUnit = function(code){        
        var deferred = $q.defer();
        var resourceName = ResourceCode[parseInt(code)];
        UserService.getDefaultUnit(resourceName).then(function(defaultUnit){
            if(!defaultUnit){
                unitService.getReferenceUnitByCode(code).then(deferred.resolve, deferred.reject);
            }else{
                deferred.resolve(defaultUnit);
            }
        }, deferred.reject);
        return deferred.promise;
    };
    
    
    unitService.getReferenceUnit = function(units){
        var referenceUnit = null;
        if(units && units.length > 0){
            angular.forEach(units, function(unit){
               if(unit.coefficient === 1) {
                   referenceUnit = unit;
                   return;
               }
            });
        }
        return referenceUnit;
    };    
    
    
    return unitService;    
}]);

