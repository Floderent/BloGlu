(function () {
    'use strict';

    angular
            .module('bloglu.category')
            .controller('categoryController', categoryController);

    categoryController.$inject = ['$scope', 'menuHeaderService', 'MessageService', 'categoryService', 'ResourceName', 'ResourceIcon', 'Utils'];

    function categoryController($scope, menuHeaderService, MessageService, categoryService, ResourceName, ResourceIcon, Utils) {

        var vm = this;

        vm.eventsTypes = ResourceName;
        vm.code = 1;
        vm.eventType = ResourceName[vm.code]; 
        vm.eventsIcons = ResourceIcon;

        vm.selectType = selectType;
        vm.saveCategory = saveCategory;
        vm.updateCategory = updateCategory;
        vm.deleteCategory = deleteCategory;
        vm.editCategory = editCategory;
        vm.cancelEditCategory = cancelEditCategory;

        renderPage();

        function selectType(key, value) {            
            vm.code = parseInt(key);
            vm.eventType = value;
            getCategories();
        }

        function renderPage() {            
            getCategories();
        }
        
        function getCategories() {
            menuHeaderService.increasePending("processingMessage.loadingCategoriesData");
            categoryService.getCategoriesByCode(vm.code).then(function (result) {
                vm.categories = result;
            }, function (error) {
                MessageService.errorMessage("errorMessage.loadingError", 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending("processingMessage.loadingCategoriesData");
            });
        }

        function saveCategory(category) {
            if (category && category.name) {
                menuHeaderService.increasePending("processingMessage.savingData");
                category.code = vm.code;
                categoryService.saveCategory(category).then(function (result) {
                    angular.extend(category, result);
                    vm.categories.push(category);
                    vm.newCategory = {};
                    MessageService.successMessage("successMessage.categoryCreated", 2000);
                }, function (error) {
                    MessageService.errorMessage("errorMessage.creatingError", 2000);
                })['finally'](function () {
                    menuHeaderService.decreasePending();
                });
            }
        }
        

        function updateCategory(category) {
            if (category.objectId) {
                menuHeaderService.increasePending("processingMessage.updatingData");
                category.code = vm.code;
                categoryService.saveCategory(category, true).then(function (result) {
                    category.isEdit = false;
                    MessageService.successMessage("successMessage.categoryUpdated", 2000);
                }, function (error) {
                    vm.cancelEditPeriod(category);
                    MessageService.errorMessage("errorMessage.updatingError", 2000);
                })['finally'](function () {
                    menuHeaderService.decreasePending("processingMessage.updatingData");
                });
            }
        }

        function deleteCategory(category) {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: {id: 'confirm.deletionMessageWithName', params: {objectName: category.name}},
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    if (category.objectId) {
                        menuHeaderService.increasePending("processingMessage.deletingData");
                        categoryService.deleteCategory(category.objectId).then(function (result) {
                            var categoryIndex = -1;
                            angular.forEach(vm.categories, function (cat, index) {
                                if (cat.objectId && cat.objectId === category.objectId) {
                                    categoryIndex = index;
                                }
                            });
                            if (categoryIndex !== -1) {
                                vm.categories.splice(categoryIndex, 1);
                            }
                        }, function (error) {
                            MessageService.errorMessage('errorMessage.deletingError', 2000);
                        })['finally'](function () {
                            menuHeaderService.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function () {
                //exit
            });
        }
        
        function editCategory(category) {
            category.isEdit = true;
            category.original = angular.extend({}, category);
        }

        function cancelEditCategory(category) {
            category.isEdit = false;
            category.code = category.original.code;
            category.name = category.original.name;
            delete category.original;
        }

        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }

})();