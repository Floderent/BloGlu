'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('loginController', ['$scope', '$rootScope', '$location', 'UserService', 'MessageService', 'AUTH_EVENTS', function Controller($scope, $rootScope, $location, UserService, MessageService, AUTH_EVENTS) {

        $scope.logIn = function(form) {
            if (form) {
                $rootScope.increasePending("processingMessage.connecting");
                UserService.logIn(form.username, form.password)
                        .success(function(authenticatedUser) {                            
                            $rootScope.currentUser = authenticatedUser;
                            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                            $location.path('dashboard');
                        })
                        .error(function(error) {                            
                            switch (error.code) {
                                case 101:                                    
                                    $rootScope.messages.push(MessageService.errorMessage("errorMessage.wrongCredentials", 2000));
                                    break;
                                default:
                                    $rootScope.messages.push(MessageService.errorMessage("errorMessage.cannotLogin", 2000));
                                    break;
                            }
                        }).finally(function(){
                            $rootScope.decreasePending("processingMessage.connecting");
                        });
            }
        };

    }]);
