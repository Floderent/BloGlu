'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('loginController', ['$scope', '$rootScope', '$location', 'UserSessionService', 'MessageService', 'AUTH_EVENTS', function Controller($scope, $rootScope, $location, UserSessionService, MessageService, AUTH_EVENTS) {


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
            UserSessionService.logInWithFacebook().then(loginSuccessful, loginFailed)['finally'](function(){
                $rootScope.decreasePending("processingMessage.connecting");
            });
        };


    }]);
