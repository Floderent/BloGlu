(function () {
    'use strict';

    angular.module('bloglu.login')
            .controller('loginController', loginController);

    loginController.$inject = ['$scope', '$rootScope', '$location', '$modal', 'UserSessionService', 'MessageService', 'AUTH_EVENTS'];

    function loginController($scope, $rootScope, $location, $modal, UserSessionService, MessageService, AUTH_EVENTS) {
        
        var modal = null;
        
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

        $scope.logIn = function (form) {
            if (form) {
                $rootScope.increasePending("processingMessage.connecting");
                UserSessionService.logIn(form.username, form.password)
                        .success(loginSuccessful)
                        .error(loginFailed)['finally'](function () {
                    $rootScope.decreasePending("processingMessage.connecting");
                });
            }
        };

        $scope.logInWithFacebook = function () {
            $rootScope.increasePending("processingMessage.connecting");
            UserSessionService.logInWithFacebook().then(loginSuccessful, loginFailed)['finally'](function () {
                $rootScope.decreasePending("processingMessage.connecting");
            });
        };
        
        
        $scope.displaySignUpModal = function () {
            $scope.messages = [];
            UserSessionService.displaySignUpModal();
        };

        $scope.displayResetPasswordModal = function () {
            $rootScope.messages = [];
            UserSessionService.displayResetPasswordModal();
        };
        
        
        
    }
})();
