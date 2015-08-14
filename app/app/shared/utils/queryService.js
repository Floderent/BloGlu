(function () {
    'use strict';

    angular.module('bloglu.utils')
            .factory('queryService', queryService);

    queryService.$inject = ['dataService'];

    function queryService(dataService) {

        var resourceName = 'Metadatamodel';

        var queryService = {
            getMetadatamodel: getMetadatamodel,
            getMeasures: getMeasures,
            getLevels: getLevels,
            getFilters: getFilters
        };
        return queryService;


        function getMetadatamodel() {
            return dataService.queryLocal(resourceName);
        }

        function getMeasures() {
            var measures = [];
            return dataService.queryLocal(resourceName).then(function (mdm) {
                angular.forEach(mdm, function (mdmElement) {
                    if (mdmElement.aggregate) {
                        measures.push(mdmElement);
                    }
                });
                return measures;
            });
        }

        function getLevels() {
            var levels = [];
            return dataService.queryLocal(resourceName).then(function (mdm) {
                angular.forEach(mdm, function (mdmElement) {
                    if (!mdmElement.aggregate) {
                        levels.push(mdmElement);
                    }
                });
                return levels;
            });
        }

        function getFilters() {
            var result = [];
            angular.forEach(dataService.where, function (whereElement) {
                result.push(whereElement);
            });
            return result;
        }


    }
})();