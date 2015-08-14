(function () {
    'use strict';

    angular.module('bloglu.utils')
            .factory('unitService', unitService);

    unitService.$inject = ['$q', 'dataService', 'UserService', 'ResourceCode'];

    function unitService($q, dataService, UserService, ResourceCode) {

        var resourceName = 'Unit';

        var unitService = {
            getUnitsByCode: getUnitsByCode,
            getUnitById: getUnitById,
            getReferenceUnitByCode: getReferenceUnitByCode,
            getReferenceUnitByResourceName: getReferenceUnitByResourceName,
            getUnit: getUnit,
            getUnitByResourceName: getUnitByResourceName,
            getReferenceUnit: getReferenceUnit
        };
        return unitService;

        function getUnitsByCode(code) {
            return dataService.queryLocal(resourceName, {where: {code: code}});
        }

        function getUnitById(objectId) {
            return dataService.get(resourceName, objectId);
        }

        function getReferenceUnitByCode(code) {
            return dataService.queryLocal(resourceName, {where: {code: code, coefficient: 1}}).then(function (results) {
                if (results && results.length >= 1) {
                    return results[0];
                }
                return results;
            });
        }

        function getReferenceUnitByResourceName(resourceName) {
            return unitService.getReferenceUnitByCode(ResourceCode[resourceName]);
        }

        function getUnit(code) {
            var resourceName = ResourceCode[parseInt(code)];
            return unitService.getUnitByResourceName(resourceName);
        }

        function getUnitByResourceName(resourceName) {
            return $q(function (resolve, reject) {
                UserService.getDefaultUnit(resourceName).then(function (defaultUnit) {
                    if (!defaultUnit) {
                        unitService.getReferenceUnitByResourceName(resourceName).then(resolve, reject);
                    } else {
                        resolve(defaultUnit);
                    }
                }, reject);
            });
        }

        function getReferenceUnit(units) {
            var referenceUnit = null;
            if (units && units.length > 0) {
                angular.forEach(units, function (unit) {
                    if (unit.coefficient === 1) {
                        referenceUnit = unit;
                        return;
                    }
                });
            }
            return referenceUnit;
        }



    }
})();