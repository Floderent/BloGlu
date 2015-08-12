(function () {
'use strict';

angular.module('bloglu.utils')
        .factory('ServerService', ServerService)
        .factory('MyInterceptor', MyInterceptor)
        .factory('MessageService', MessageService)
;

MyInterceptor.$inject = ['$q', '$rootScope', 'AUTH_EVENTS'];

function ServerService() {
        var applicationId = 'U5hc606XgvqC5cNoBW9EUOYRPN28bGsiowBYLVbv';
        var restApiKey = 'PPawPdkaltJhjHktfeHaQeBoVOYgphPn0ByIZl5v';
        return {
            headers: {
                "Content-Type": 'application/json',
                "X-Parse-Application-Id": applicationId,
                "X-Parse-REST-API-Key": restApiKey
            },
            baseUrl: 'https://api.parse.com/1/',
            applicationId: applicationId,
            restApiKey: restApiKey
        };
    }


function MyInterceptor($q, $rootScope, AUTH_EVENTS) {
        return {
            responseError: function(rejection) {
                switch (rejection.status) {
                    case 401:
                        $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated, rejection);
                        break;
                    case 403:
                        $rootScope.$broadcast(AUTH_EVENTS.notAuthorized, rejection);
                        break;
                    case 419:
                    case 440:
                        $rootScope.$broadcast(AUTH_EVENTS.sessionTimeout, rejection);
                        break;
                }
                return $q.reject(rejection);
            }
        };
    }

MessageService.$inject = ['$translate', 'Notification'];

function MessageService($translate, Notification) {
        var messageService = {            
            errorMessage: errorMessage,
            successMessage: successMessage
        };
        return messageService;
        
        function errorMessage(text, delay) {
            return Notification.error({message: $translate.instant(text), delay: delay});
        }
        function successMessage(text, delay) {
            return Notification.success({message: $translate.instant(text), delay: delay});            
        }        
        
    }
})();