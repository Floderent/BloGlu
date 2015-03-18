(function () {
    'use strict';

    angular.module('bloglu.login')
            .controller('resetPasswordController', resetPasswordController);

    resetPasswordController.$inject = ['$modalInstance', 'UserSessionService'];

    function resetPasswordController($modalInstance, UserSessionService) {
        
        var vm = this;
        
        vm.resettingPassword = false;
        vm.erroMessage = "";
        vm.successMessage = "";
        vm.cancel = cancel;
        vm.resetPassword = resetPassword;
        
        function cancel() {
            $modalInstance.dismiss('canceled');
        }
        
        function resetPassword(email) {
            vm.successMessage = null;
            vm.erroMessage = null;
            vm.resettingPassword = true;
            UserSessionService.requestPasswordReset(email)
                    .success(function (result) {
                        vm.successMessage = 'Password reset';
                        vm.resettingPassword = false;
                    })
                    .error(function (error) {
                        vm.erroMessage = error.error;
                        vm.resettingPassword = false;
                    });
        };
    }
})();