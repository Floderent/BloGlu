'use strict';
var ControllersModule = angular.module('BloGlu.controllers');


ControllersModule.controller('rangeUnitSelectController', ['$scope', function Controller($scope) {
        $scope.$watch('range.isEdit', function (newValue, oldValue) {
            if (newValue) {
                angular.forEach($scope.units, function (unit) {
                    if (unit.objectId === $scope.range.unit.objectId) {
                        $scope.editedRangeUnit = unit;
                    }
                });
            }
        });
        $scope.$watch('editedRangeUnit', function (newValue, oldValue) {
            if (newValue && oldValue && newValue !== oldValue) {
                if ($scope.range && $scope.range.lowerLimit !== null) {
                    $scope.range.lowerLimit = $scope.range.lowerLimit * oldValue.coefficient / newValue.coefficient;
                }
                if ($scope.range && $scope.range.upperLimit !== null) {
                    $scope.range.upperLimit = $scope.range.upperLimit * oldValue.coefficient / newValue.coefficient;
                }
                $scope.range.unit = newValue;
            }
        });
    }]);



ControllersModule.controller('confirmModalController', ['$scope', '$modalInstance', function Controller($scope, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.close(1);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss(0);
        };
    }]);


ControllersModule.controller('chooseEventController', ['$scope', '$modalInstance', function Controller($scope, $modalInstance) {
        $scope.code = null;
        $scope.selectType = function (key) {
            $scope.code = parseInt(key);
        };
        $scope.ok = function () {
            $modalInstance.close($scope.code);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss(0);
        };
    }]);



ControllersModule.controller('inputUserController', ['$scope', '$rootScope', '$modalInstance', 'UserSessionService', 'MessageService', function Controller($scope, $rootScope, $modalInstance, UserSessionService, MessageService) {
        $scope.user = {};
        $scope.cancel = function () {
            $modalInstance.dismiss('canceled');
        };
        $scope.creatingUser = false;

        $scope.signUp = function () {
            $scope.successMessage = null;
            $scope.erroMessage = null;
            $scope.creatingUser = true;
            UserSessionService.signUp($scope.user)
                    .success(function (result) {
                        $scope.creatingUser = false;
                        $scope.successMessage = 'userCreated';
                        $scope.cancel();
                    })
                    .error(function (error) {
                        $scope.errorMessage = error.error;
                        $scope.creatingUser = false;
                    });
        };    
    }]);


ControllersModule.controller('resetPasswordController', ['$scope', '$modalInstance', 'UserSessionService', function Controller($scope, $modalInstance, UserSessionService) {
        $scope.cancel = function () {
            $modalInstance.dismiss('canceled');
        };
        $scope.resettingPassword = false;
        $scope.resetPassword = function (email) {
            $scope.successMessage = null;
            $scope.erroMessage = null;
            $scope.resettingPassword = true;
            UserSessionService.requestPasswordReset(email)
                    .success(function (result) {
                        $scope.successMessage = 'Password reset';
                        $scope.resettingPassword = false;
                    })
                    .error(function (error) {
                        $scope.erroMessage = error.error;
                        $scope.resettingPassword = false;
                    });
        };
    }]);




