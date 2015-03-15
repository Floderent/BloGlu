(function () {
    'use strict';

    angular.module('bloglu.login')
            .controller('inputUserController', inputUserController);

    inputUserController.$inject = ['$scope', '$modalInstance', 'UserSessionService'];

    function inputUserController($scope, $modalInstance, UserSessionService) {
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
    }
})();