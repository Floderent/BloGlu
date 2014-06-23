'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('categoryService', ['$q', 'dataService', 'queryService', 'genericDaoService', function($q, dataService, queryService, genericDaoService) {

        var categoryService = {};
        var resourceName = 'Category';

        categoryService.getCategoriesByCode = function(code) {
            return dataService.queryLocal(resourceName, {where: {code: code}});
        };

        categoryService.saveCategory = function(category, isEdit) {
            var savingPromise = null;
            var saveObject = {};
            if (category) {
                saveObject.name = category.name;
                saveObject.code = category.code;
            }
            if (isEdit) {
                savingPromise = dataService.update(resourceName, category.objectId, saveObject);
            } else {
                savingPromise = dataService.save(resourceName, saveObject);
            }
            return savingPromise;
        };


        categoryService.deleteCategory = function(category) {
            return genericDaoService.delete(resourceName, category);
        };



        return categoryService;
    }]);