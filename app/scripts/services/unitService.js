'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('unitService', ['$q', 'dataService', 'queryService', 'genericDaoService', function($q, dataService, queryService, genericDaoService) {

    var unitService = {};
    var resourceName = 'Unit';

    unitService.getUnitsByCode = function(code){
      return dataService.queryLocal(resourceName, {where: {code: code}});  
    };
    
    
    return unitService;
    
    }]);

