(function () {
    'use strict';

    angular.module('bloglu.login')
            .controller('inputUserController', inputUserController);

    inputUserController.$inject = ['$modalInstance', 'UserSessionService'];

    function inputUserController($modalInstance, UserSessionService) {

        var vm = this;

        vm.user = {};
        vm.creatingUser = false;
        vm.cancel = cancel;
        vm.signUp = signUp;

        function cancel() {
            $modalInstance.dismiss('canceled');
        }


        function signUp() {
            vm.successMessage = null;
            vm.erroMessage = null;
            vm.creatingUser = true;
            UserSessionService.signUp(vm.user)
                    .success(function (result) {
                        vm.creatingUser = false;
                        vm.successMessage = 'userCreated';
                        vm.cancel();
                    })
                    .error(function (error) {
                        vm.errorMessage = error.error;
                        vm.creatingUser = false;
                    });

        }
        ;
    }
})();