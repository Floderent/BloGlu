(function () {
    'use strict';

    angular.module('bloglu.login')
            .controller('resetPasswordController', resetPasswordController);

    resetPasswordController.$inject = ['$scope', '$modalInstance', 'UserSessionService'];

    function resetPasswordController($scope, $modalInstance, UserSessionService) {
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
    }
})();