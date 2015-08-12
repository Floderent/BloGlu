(function () {
    'use strict';
    angular.module('bloglu.menuHeader')
            .factory('menuHeaderService', menuHeaderService);

    menuHeaderService.$inject = ['$rootScope','$q','translationService', 'UserSessionService', 'dataService', 'syncService', 'AUTH_EVENTS'];

    function menuHeaderService($rootScope, $q, translationService, UserSessionService, dataService, syncService, AUTH_EVENTS) {
        
        var service = {
            loadingState:{
                pending: 0,
                progress: 0,
                loadingMessages: [],
                syncMessage: ''
            },            
            increasePending: increasePending,
            decreasePending: decreasePending,
            logOut: logOut
        };
        return service;

        function increasePending(loadingMessageKey, values) {
            service.loadingState.pending++;
            addLoadingMessage(loadingMessageKey, values);
        }

        function decreasePending(loadingMessageKey, values) {
            if (service.loadingState.pending > 0) {
                service.loadingState.pending--;
                removeLoadingMessage(loadingMessageKey, values);
            }
        }

        function addLoadingMessage(loadingMessageKey, values) {
            service.loadingState.loadingMessages.push(resolveMessage(loadingMessageKey, values));
        }

        function removeLoadingMessage(loadingMessageKey) {
            var message = resolveMessage(loadingMessageKey);
            var indexOfMessage = service.loadingState.loadingMessages.indexOf(message);
            if (indexOfMessage !== -1) {
                service.loadingState.loadingMessages.splice(indexOfMessage, 1);
            }
        }
        
        function resolveMessage(loadingMessageKey) {
            var message = '';
            if (loadingMessageKey) {
                message = translationService.translate(loadingMessageKey);                
            } else {
                message = translationService.translate('loading');
            }
            return message;
        }
        
        
        function logOut() {            
            var deferred = $q.defer();
            if (UserSessionService.getCurrentUser()) {
                increasePending('processingMessage.loggingOut');
                dataService.logOut().then(function () {
                })['finally'](function () {
                    UserSessionService.logOut();
                    service.loadingState.pending = 0;
                    service.loadingState.progress = 0;                    
                    service.loadingState.loadingMessages = [];                    
                    $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                    decreasePending('processingMessage.loggingOut');
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        };
        

    }

})();

