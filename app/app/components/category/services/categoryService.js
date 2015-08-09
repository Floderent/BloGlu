(function () {

    'use strict';

    angular
            .module('bloglu.category')
            .factory('categoryService', categoryService);
    
    categoryService.$inject = ['dataService', 'genericDaoService'];

    function categoryService(dataService, genericDaoService) {

        var categoryService = {};
        var resourceName = 'Category';

        categoryService.getCategoriesByCode = function (code) {
            return dataService.queryLocal(resourceName, {where: {code: code}});
        };

        categoryService.saveCategory = function (category, isEdit) {
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


        categoryService.deleteCategory = function (category) {
            return genericDaoService.remove(resourceName, category);
        };



        return categoryService;
    }
})();