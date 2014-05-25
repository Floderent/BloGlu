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

servicesModule.factory('ResourceCode', [function() {
        return {
            other: 0,
            bloodGlucose: 1,
            medication: 2,
            weight: 3,
            bloodPressure: 4,
            a1c: 5,
            exercise: 6,
            0: 'other',
            1: 'bloodGlucose',
            2: 'medication',
            3: 'weight',
            4: 'bloodPressure',
            5: 'a1c',
            6: 'exercise'
        };
    }]);

servicesModule.factory('ResourceName', [function() {
        return {            
            0: 'Other',
            1: 'Blood Glucose',
            2: 'Medication',
            3: 'Weight',
            4: 'Blood Pressure',
            5: 'a1c',
            6: 'Exercise'
        };
    }]);


servicesModule.factory('Database', [function() {
        return {
            schema: [
                'Event',
                'Period',
                'Report',
                'Dashboard',
                'Target',
                'Metadatamodel',
                'Category',
                'Unit'
            ]
        };
    }]);



servicesModule.factory('MyInterceptor', ['$q', '$location', '$injector', function($q, $location, $injector) {
        return {
            responseError: function(rejection) {
                if (rejection.status === 401) {
                    //UserService.logOut();
                    $location.path("/").search('returnTo', $location.path());
                }
                return $q.reject(rejection);
            }
        };
    }]);

servicesModule.factory('MessageService', ['$timeout', function($timeout) {
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
                messages.forEach(function(message) {
                    messageService.cancel(message);
                });
            }
        };
        return messageService;
    }]);