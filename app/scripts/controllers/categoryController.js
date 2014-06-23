'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('categoryController', ['$rootScope', '$scope', '$modal', 'MessageService', 'categoryService', 'ResourceName', function Controller($rootScope, $scope, $modal, MessageService, categoryService, ResourceName) {
        
        $scope.eventsTypes = ResourceName;
        $scope.code = 1;
        $scope.eventType = ResourceName[$scope.code];        

        renderPage();

        $scope.$watch('code', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                getCategories();
            }
        });

        $scope.selectType = function(key) {
            $scope.code = parseInt(key);
            $scope.eventType = ResourceName[$scope.code];
        };

        function renderPage() {
            getCategories();
        }

        function getCategories() {
            $rootScope.increasePending("processingMessage.loadingCategoriesData");
            categoryService.getCategoriesByCode($scope.code).then(function(result) {
                $scope.categories = result;
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
            }).finally(function() {
                $rootScope.decreasePending("processingMessage.loadingCategoriesData");
            });
        }

        $scope.saveCategory = function(category) {
            if (category && category.name) {
                $rootScope.increasePending("processingMessage.savingData");
                category.code = $scope.code;
                categoryService.saveCategory(category).then(function(result) {
                    angular.extend(category, result);
                    $scope.categories.push(category);
                    $scope.newCategory = {};
                    $rootScope.messages.push(MessageService.successMessage("successMessage.categoryCreated", 2000));
                }, function(error) {
                    $rootScope.messages.push(MessageService.errorMessage("errorMessage.creatingError", 2000));
                }).finally(function() {
                    $rootScope.decreasePending();
                });
            }
        };

        $scope.updateCategory = function(category) {
            if (category.objectId) {
                $rootScope.increasePending("processingMessage.updatingData");
                category.code = $scope.code;
                categoryService.saveCategory(category, true).then(function(result) {
                    category.isEdit = false;
                    $rootScope.messages.push(MessageService.successMessage("successMessage.categoryUpdated", 2000));
                }, function(error) {
                    $scope.cancelEditPeriod(category);
                    $rootScope.messages.push(MessageService.errorMessage("errorMessage.updatingError", 2000));
                }).finally(function() {
                    $rootScope.decreasePending("processingMessage.updatingData");
                });
            }
        };


        $scope.deleteCategory = function(category) {
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = category.name;
            var modalInstance = $modal.open({
                templateUrl: "views/modal/confirm.html",
                controller: "confirmModalController",
                scope: $modalScope,
                resolve: {
                    confirmed: function() {
                        return $scope.confirmed;
                    }
                }
            });
            modalInstance.result.then(function(confirmed) {
                if (confirmed) {
                    if (category.objectId) {
                        $rootScope.increasePending("processingMessage.deletingData");
                        categoryService.deleteCategory(category.objectId).then(function(result) {
                            var categoryIndex = -1;
                            angular.forEach($scope.categories, function(cat, index) {
                                if (cat.objectId && cat.objectId === category.objectId) {
                                    categoryIndex = index;
                                }
                            });
                            if (categoryIndex !== -1) {
                                $scope.categories.splice(categoryIndex, 1);
                            }
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                        }).finally(function() {
                            $rootScope.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function() {
                //exit
            });

        };


        $scope.editCategory = function(category) {
            category.isEdit = true;
            category.original = angular.extend({}, category);
        };

        $scope.cancelEditCategory = function(category) {
            category.isEdit = false;
            category.code = category.original.code;
            category.name = category.original.name;
            delete category.original;
        };


        $rootScope.$on('dataReady', renderPage);        

    }]);