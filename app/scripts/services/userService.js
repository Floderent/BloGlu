'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('UserService', [
    '$q',
    'genericDaoService',
    'UserSessionService',    
        function (
            $q,
            genericDaoService,
            UserSessionService            
            ) {
        
        var UserService = {};
        var resourceName = 'User';
        
        UserService.saveUser = function (user) {
            return genericDaoService.save(resourceName, user, true);
        };
        
        UserService.getUser = function (userId) {
            return genericDaoService.get(resourceName, userId).then(function(user){
                return user;
            });
        };
        
        UserService.getCurrentUser = function(){
            return genericDaoService.get(resourceName, UserSessionService.userId()).then(function(user){
                return user;
            });
        };
        
        UserService.getPreferences = function(){
            var deferred = $q.defer();
            UserService.getCurrentUser().then(function(currentUser){
                if(currentUser.preferences){
                    deferred.resolve(currentUser.preferences);
                }else{
                    deferred.resolve(null);
                }
            }, deferred.reject);
            
            return deferred.promise;
        };
        
        
        UserService.deleteUser = function (user) {
            return genericDaoService.delete(resourceName, user);
        };                        

        UserService.getFirstDayOfWeek = function () {
            var deferred = $q.defer();
            var firstDayOfWeek = 0;
            UserService.getPreferences().then(function(preferences){
                if(preferences && preferences.firstDayOfWeek){
                    deferred.resolve(preferences.firstDayOfWeek);
                }else{
                    deferred.resolve(firstDayOfWeek);
                }
            },deferred.reject);
            return deferred.promise;
        };
        
        UserService.getDefaultUnits = function(){            
            var deferred = $q.defer();
            var defaultUnits = null;
            UserService.getPreferences().then(function(preferences){
                if(preferences.defaultUnits){
                    deferred.resolve(preferences.defaultUnits);
                }else{
                    deferred.resolve(defaultUnits);
                }
            }, deferred.reject);            
            return deferred.promise;
        };
        
        
        UserService.getDefaultUnit = function(resourceName){            
            var deferred = $q.defer();            
            UserService.getDefaultUnits().then(function(defaultUnits){
                if(defaultUnits){
                    deferred.resolve(defaultUnits[resourceName]);
                }else{
                    deferred.resolve(null);
                }
            }, deferred.reject);            
            return deferred.promise;
        };
        
        
        return UserService;
    }]);

