'use strict';
var ControllersModule = angular.module('BloGlu.controllers');

ControllersModule.controller('applicationController', ['$scope', '$rootScope', '$modal', 'AUTH_EVENTS', '$location', '$route', '$timeout', 'UserService', 'syncService', 'dataService', 'localizationService','MessageService', function Controller($scope, $rootScope, $modal, AUTH_EVENTS, $location, $route, $timeout, UserService, syncService, dataService, localizationService, MessageService) {

        $rootScope.currentUser = UserService.currentUser();
        $rootScope.messages = [];
        $rootScope.loadingMessages = [];
        $rootScope.pending = 0;
        var modal = null;

        $rootScope.displaySignUpModal = function() {
            $scope.messages = [];
            modal = $modal.open({
                templateUrl: 'views/modal/inputUser.html',
                controller: 'inputUserController'
            });
        };

        $rootScope.displayResetPasswordModal = function() {
            $rootScope.messages = [];
            modal = $modal.open({
                templateUrl: 'views/modal/resetPassword.html',
                controller: 'resetPasswordController'
            });
        };

        $rootScope.logOut = function() {
            $rootScope.increasePending('processingMessage.loggingOut');
            dataService.logOut().then(function() {
                $rootScope.currentUser = null;                
            }).finally(function() {
                UserService.logOut();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                $rootScope.decreasePending('processingMessage.loggingOut');
            });
        };

        $rootScope.increasePending = function(loadingMessageKey, values) {
            $rootScope.pending++;
            $rootScope.addLoadingMessage(loadingMessageKey, values);
        };

        $rootScope.decreasePending = function(loadingMessageKey, values) {
            if ($rootScope.pending > 0) {
                $rootScope.pending--;
                $rootScope.removeLoadingMessage(loadingMessageKey, values);
            }
        };

        $rootScope.addLoadingMessage = function(loadingMessageKey, values) {             
            $rootScope.loadingMessages.push(resolveMessage(loadingMessageKey, values));
        };
        
        $rootScope.removeLoadingMessage = function(loadingMessageKey, values){
            var message = resolveMessage(loadingMessageKey, values);
            var indexOfMessage = $rootScope.loadingMessages.indexOf(message);
            if(indexOfMessage !== -1){
                $rootScope.loadingMessages.splice(indexOfMessage, 1);
            }
        };
        
        
        function resolveMessage(loadingMessageKey, values){
            var message = '';
            if (loadingMessageKey) {
                message = localizationService.get(loadingMessageKey);
                if (values) {
                    message = localizationService.applyLocalizedTemplate(message, values);
                }                
            } else {
                message = localizationService.get('loading');
            }
            return message;
        }


        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function(event) {
            //wait the end of the digest cycle
            $timeout(function() {
                $location.path('login');
            });
        });

        $rootScope.$on(AUTH_EVENTS.loginSuccess, function(event, next) {
            $rootScope.increasePending('processingMessage.synchronizing');
            syncService.sync().then(
                    function resolve() {                        
                    },
                    function reject() {
                        MessageService.errorMessage('errorMessage.synchronisationError',5000);
                    },
                    function notify(message) {                        
                        //$rootScope.setLoadingMessage(message);
                    }
            ).finally(function(result) {
                $rootScope.decreasePending('processingMessage.synchronizing');
            });
        });

        $rootScope.$on('$locationChangeStart', function(event, next) {
            //if navigation to page other than login and not authenticated, trigger "not authenticated event"
            if (!UserService.isAuthenticated() && next.indexOf('login', next.length - 'login'.length) === -1) {
                event.preventDefault();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
            }
        });

        $rootScope.$on('language-change', function(event) {
            //wait the end of the digest cycle
            $timeout(function() {
                $route.reload();
            });
        });


    }]);


