(function () {
    'use strict';

    angular.module('bloglu')
            .controller('applicationController', applicationController);

    applicationController.$inject = ['$q','$scope', '$rootScope', 'AUTH_EVENTS', '$location', '$route', '$timeout', 'UserSessionService', 'UserService', 'syncService', 'dataService', 'localizationService', 'MessageService'];


    function applicationController( $q, $scope, $rootScope, AUTH_EVENTS, $location, $route, $timeout, UserSessionService, UserService, syncService, dataService, localizationService, MessageService) {

        $rootScope.currentUser = UserSessionService.currentUser();
        $rootScope.currentUserInfos = null;
        $rootScope.messages = [];
        $rootScope.loadingMessages = [];
        $rootScope.pending = 0;
        $rootScope.progress = 0;

        $rootScope.syncMessage = syncService.message;        

        function renderPage() {
            UserService.getCurrentUser().then(function (currentUser) {
                $rootScope.currentUserInfos = currentUser;
            });
        }

        function resolveMessage(loadingMessageKey, values) {
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

        function progressHandler(progress, message) {
            $rootScope.progress = progress;
        }
       

        $rootScope.logOut = function () {
            var deferred = $q.defer();
            if (UserSessionService.currentUser()) {
                $rootScope.increasePending('processingMessage.loggingOut');
                dataService.logOut().then(function () {

                })['finally'](function () {
                    UserSessionService.logOut();
                    $rootScope.pending = 0;
                    $rootScope.progress = 0;
                    MessageService.cancelAll($rootScope.messages);
                    $rootScope.loadingMessages = [];
                    $rootScope.currentUser = null;
                    $rootScope.currentUserInfos = null;
                    $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                    $rootScope.decreasePending('processingMessage.loggingOut');
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        };

        $rootScope.increasePending = function (loadingMessageKey, values) {
            $rootScope.pending++;
            $rootScope.addLoadingMessage(loadingMessageKey, values);
        };

        $rootScope.decreasePending = function (loadingMessageKey, values) {
            if ($rootScope.pending > 0) {
                $rootScope.pending--;
                $rootScope.removeLoadingMessage(loadingMessageKey, values);
            }
        };

        $rootScope.addLoadingMessage = function (loadingMessageKey, values) {
            $rootScope.loadingMessages.push(resolveMessage(loadingMessageKey, values));
        };

        $rootScope.removeLoadingMessage = function (loadingMessageKey, values) {
            var message = resolveMessage(loadingMessageKey, values);
            var indexOfMessage = $rootScope.loadingMessages.indexOf(message);
            if (indexOfMessage !== -1) {
                $rootScope.loadingMessages.splice(indexOfMessage, 1);
            }
        };


        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function (event) {
            //wait the end of the digest cycle
            if (UserSessionService.currentUser()) {
                $rootScope.logOut()['finally'](function () {
                    $timeout(function () {
                        $location.path('login');
                    });
                });
            } else {
                $timeout(function () {
                    $location.path('login');
                });
            }
        });

        $rootScope.$on(AUTH_EVENTS.loginSuccess, function (event, params) {
            $rootScope.increasePending('processingMessage.synchronizing');
            var syncMode = "online";
            if (params) {
                syncMode = params.mode;
            }
            syncService.sync(progressHandler, syncMode).then(
                    function () {
                        $rootScope.progress = 100;
                    },
                    function () {
                        MessageService.errorMessage('errorMessage.synchronisationError', 5000);
                    }
            )['finally'](function (result) {
                $rootScope.decreasePending('processingMessage.synchronizing');
            });
        });

        $rootScope.$on('$locationChangeStart', function (event, next) {
            //if navigation to page other than login and not authenticated, trigger "not authenticated event"
            if (!UserSessionService.isAuthenticated() && next.indexOf('login', next.length - 'login'.length) === -1) {
                event.preventDefault();
                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
            }
        });

        $rootScope.$on('language-change', function (event) {
            //wait the end of the digest cycle
            $timeout(function () {
                $route.reload();
            });
        });

        /*
         $rootScope.$on('$routeChangeStart', function(){
         $rootScope.increasePending();            
         });        
         $rootScope.$on('$routeChangeSuccess', function(){
         $rootScope.decreasePending();            
         });
         $rootScope.$on('$routeChangeError', function(){
         $rootScope.decreasePending();            
         });
         */
        
        var unbind = $rootScope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);

    }
})();