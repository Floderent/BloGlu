(function () {
    'use strict';

    angular.module('bloglu.login')
            .controller('loginController', loginController);

    loginController.$inject = ['$rootScope', '$location', 'UserSessionService', 'MessageService', 'AUTH_EVENTS'];

    function loginController($rootScope, $location, UserSessionService, MessageService, AUTH_EVENTS) {
        
        var vm = this;
        
        vm.logIn = logIn;
        vm.logInWithFacebook = logInWithFacebook;
        vm.displaySignUpModal = displaySignUpModal;
        vm.displayResetPasswordModal = displayResetPasswordModal;        
        
        function loginSuccessful(authenticatedUser) {
            $rootScope.currentUser = authenticatedUser;
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            $location.path('dashboard');
        }

        function loginFailed(error) {
            switch (error.code) {
                case 101:
                    $rootScope.messages.push(MessageService.errorMessage("errorMessage.wrongCredentials", 2000));
                    break;
                default:
                    $rootScope.messages.push(MessageService.errorMessage("errorMessage.cannotLogin", 2000));
                    break;
            }
        }

        function logIn(form) {
            if (form) {
                $rootScope.increasePending("processingMessage.connecting");
                UserSessionService.logIn(form.username, form.password)
                        .success(loginSuccessful)
                        .error(loginFailed)['finally'](function () {
                    $rootScope.decreasePending("processingMessage.connecting");
                });
            }
        }

        function logInWithFacebook() {
            $rootScope.increasePending("processingMessage.connecting");
            UserSessionService.logInWithFacebook().then(loginSuccessful, loginFailed)['finally'](function () {
                $rootScope.decreasePending("processingMessage.connecting");
            });
        }      
        
        function displaySignUpModal() {
            vm.messages = [];
            UserSessionService.displaySignUpModal();
        }

        function displayResetPasswordModal() {
            $rootScope.messages = [];
            UserSessionService.displayResetPasswordModal();
        }
    }
})();
