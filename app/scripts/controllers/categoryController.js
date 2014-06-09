'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('categoryController', ['$rootScope', '$scope', '$modal','$window', 'MessageService', 'dataService','ResourceName', function Controller($rootScope, $scope, $modal, $window, MessageService, dataService,ResourceName) {
        $rootScope.messages = [];
        $rootScope.pending = 0;
        
        $scope.eventsTypes = ResourceName;
        $scope.code = 1;
        $scope.eventType = ResourceName[$scope.code];
        
        
        var resourceName = 'Category';
        renderPage();

        $scope.$watch('code', function(newValue, oldValue) {            
            if(newValue !== oldValue){                
                getCategories();
            }
        });
        
        $scope.selectType = function(key){            
            $scope.code = parseInt(key);
            $scope.eventType = ResourceName[$scope.code];
        };
        
        function renderPage() {
            getCategories();
        }
       
       
       function getCategories(){
           $rootScope.pending++;
            dataService.queryLocal(resourceName, {where:{code: $scope.code}}).then(function(result) {
                $scope.categories = result;                
                $rootScope.pending--;
            }, function(error) {
                $rootScope.messages.push(MessageService.errorMessage("Error loading categories.", 2000));
                $rootScope.pending--;
            });
       }
       

        $scope.saveCategory = function(category) {
            if (category && category.name) {
                $rootScope.pending++;
                dataService.save(resourceName, {
                    name: category.name,
                    code: $scope.code
                }).then(function(result) {
                    angular.extend(category, result);
                    $scope.categories.push(category);  
                    $scope.newCategory = {};
                    $rootScope.messages.push(MessageService.successMessage("Category created.", 2000));
                    $rootScope.pending--;
                }, function(error) {
                    $rootScope.messages.push(MessageService.errorMessage("Error creating category.", 2000));
                    $rootScope.pending--;
                });

            }
        };

        $scope.deleteCategory = function(category) {
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = "the " + category.name + " category";
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
                        $rootScope.pending++;
                        dataService.delete(resourceName, category.objectId).then(function(result) {
                            var categoryIndex = -1;
                            $scope.categories.forEach(function(cat, index) {
                                if (cat.objectId && cat.objectId === category.objectId) {
                                    categoryIndex = index;
                                }
                            });
                            if (categoryIndex !== -1) {
                                $scope.categories.splice(categoryIndex, 1);
                            }                            
                            $rootScope.pending--;
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage('Problem deleting category', 2000));
                            $rootScope.pending--;
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

        $scope.updateCategory = function(category) {
            if (category.objectId) {
                $rootScope.pending++;
                dataService.update(resourceName, category.objectId, {
                    name: category.name,
                    code: category.code
                }).then(function(result) {
                    category.isEdit = false;                    
                    $rootScope.pending--;
                }, function(error) {
                    $scope.cancelEditPeriod(category);
                    $rootScope.pending--;
                });
            }
        };
        
        $window.addEventListener('dataReady', renderPage);
        

        $scope.$on('$routeChangeStart', function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            $rootScope.pending = 0;
            //clear messages
            $rootScope.messages = [];
            //clear events
            $window.removeEventListener('dataReady',renderPage);
        });


    }]);