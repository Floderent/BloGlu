(function () {

    'use strict';

    angular
            .module('bloglu.category')
            .factory('categoryService', categoryService);
    
    categoryService.$inject = ['dataService', 'genericDaoService'];

    function categoryService(dataService, genericDaoService) {
        
        var resourceName = 'Category';
        
        var categoryService = {
            getCategoriesByCode: getCategoriesByCode,
            saveCategory: saveCategory,
            deleteCategory: deleteCategory
        };
        return categoryService;

        function getCategoriesByCode(code) {
            return dataService.queryLocal(resourceName, {where: {code: code}});
        }

        function saveCategory(category, isEdit) {
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
        }

        function deleteCategory(category) {
            return genericDaoService.remove(resourceName, category);
        }
        
    }
})();