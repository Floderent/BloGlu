(function () {
    'use strict';

    angular.module('bloglu.login')
            .controller('loginController', loginController);

    loginController.$inject = ['$rootScope','$q', 'menuHeaderService', 'UserSessionService', 'MessageService', 'AUTH_EVENTS'];

    function loginController($rootScope, $q, menuHeaderService, UserSessionService, MessageService, AUTH_EVENTS) {

        var vm = this;
        
        vm.loadingState = menuHeaderService.loadingState;
        vm.logIn = logIn;
        vm.logInWithFacebook = logInWithFacebook;
        vm.displaySignUpModal = displaySignUpModal;
        vm.displayResetPasswordModal = displayResetPasswordModal;

        function loginSuccessful() {            
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);            
        }

        function loginFailed(error) {
            switch (error.code) {
                case 101:
                    MessageService.errorMessage('errorMessage.wrongCredentials', 2000);
                    break;
                default:
                    MessageService.errorMessage('errorMessage.cannotLogin', 2000);
                    break;
            }
        }

        function logIn(form) {
            return $q(function (resolve, reject) {
                if (form) {                    
                    menuHeaderService.increasePending('processingMessage.connecting');                    
                    UserSessionService.logIn(form.username, form.password).then(function(){                        
                        loginSuccessful();
                        resolve();
                    }, function(error){
                        loginFailed();
                        reject();
                    })['finally'](function () {
                        menuHeaderService.decreasePending('processingMessage.connecting');
                    });
                }else{
                    reject();
                }
            });
        }

        function logInWithFacebook() {
            menuHeaderService.increasePending('processingMessage.connecting');
            UserSessionService.logInWithFacebook().then(loginSuccessful, loginFailed)['finally'](function () {
                menuHeaderService.decreasePending('processingMessage.connecting');
            });
        }

        function displaySignUpModal() {
            vm.messages = [];
            UserSessionService.displaySignUpModal();
        }

        function displayResetPasswordModal() {
            UserSessionService.displayResetPasswordModal();
        }
    }
})();
