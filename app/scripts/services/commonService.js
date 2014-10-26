'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('ServerService', [function() {
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
    }]);

servicesModule.factory('MyInterceptor', ['$q', '$rootScope', '$location', 'AUTH_EVENTS', function($q, $rootScope, $location, AUTH_EVENTS) {
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
    }]);

servicesModule.factory('MessageService', ['$timeout', 'localizationService', function($timeout, localizationService) {
        var messageService = {};
        messageService.message = function(type, text, delay) {
            var message = {
                display: true,
                text: text,
                type: type
            };
            if (delay) {
                message.autoclose = function() {
                    var that = this;
                    that.promise = $timeout(function() {
                        that.display = false;
                        //
                    }, delay);
                }.bind(message);
                message.autoclose();
            }
            return message;
        };
        messageService.errorMessage = function(text, delay) {
            return messageService.message('error', text, delay);
        };
        messageService.successMessage = function(text, delay) {
            return messageService.message('success', text, delay);
        };
        messageService.cancel = function(message) {
            if (message.promise) {
                $timeout.cancel(message.promise);
            }
        };
        messageService.cancelAll = function(messages) {
            if (messages && Array.isArray(messages)) {
                angular.forEach(messages, function(message) {
                    messageService.cancel(message);
                });
            }
        };

        messageService.applyTemplate = function(text, values) {
            debugger;
            var translatedText = localizationService.get(text);
            if (values) {
                translatedText = localizationService.applyLocalizedTemplate(translatedText, values);
            }
            return translatedText;
        };

        return messageService;
    }]);