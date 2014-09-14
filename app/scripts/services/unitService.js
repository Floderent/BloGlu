'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('unitService', ['dataService', function(dataService) {

    var unitService = {};
    var resourceName = 'Unit';

    unitService.getUnitsByCode = function(code){
      return dataService.queryLocal(resourceName, {where: {code: code}});
    };    
    
    unitService.getReferenceUnit = function(code){
        return dataService.queryLocal(resourceName, {where: {code: code, coefficient: 1}});
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

