'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('UserSessionService', [
    '$http',
    '$q',
    'localStorageService', 
    'ServerService',
    function(
            $http,
            $q,
            localStorageService,
            ServerService
            ){
        
        var UserSessionService = {};
        var cookieKey = 'sessionInfos';        
        var sessionInfos;
        
        
        UserSessionService.signUp = function (user) {
            return $http.post(ServerService.baseUrl + 'users', user, { headers: ServerService.headers});
        };
        
        UserSessionService.currentUser = function () {
            //debugger;
            return sessionInfos || localStorageService.get(cookieKey);
        };   
        
        
        UserSessionService.logIn = function (username, password) {
            return $http.get(ServerService.baseUrl + 'login',
                    {
                        headers: ServerService.headers,
                        params: {'username': username,
                                'password': password}
                    }
            ).success(function (result) {                
                delete result.email;
                sessionInfos = {
                    sessionToken: result.sessionToken, 
                    userId: result.objectId
                };
                localStorageService.set(cookieKey, sessionInfos);                
                return result;
            })
            .error(function (error) {
                return error;
            });
        };
        
        UserSessionService.isAuthenticated = function () {
            return UserSessionService.userId() && UserSessionService.sessionToken();
        };
        
        UserSessionService.requestPasswordReset = function (email) {
            return $http({
                method: 'POST',
                url: ServerService.baseUrl + 'requestPasswordReset',
                data: angular.toJson({'email': email}),
                headers: ServerService.headers
            });
        };
                
        
        UserSessionService.logOut = function () {
            sessionInfos = null;
            localStorageService.remove(cookieKey);
        };
        
        UserSessionService.sessionToken = function(){            
            var result = null;
            if(sessionInfos && sessionInfos.sessionToken){
                result = sessionInfos.sessionToken;
            }else{
                if(localStorageService.get(cookieKey) && localStorageService.get(cookieKey).sessionToken){
                    result = localStorageService.get(cookieKey).sessionToken;
                }
            }
            return result;            
        };
        
        UserSessionService.userId = function(){
            var result = null;
            if(sessionInfos && sessionInfos.userId){
                result = sessionInfos.userId;
            }else{
                if(localStorageService.get(cookieKey) && localStorageService.get(cookieKey).userId){
                    result = localStorageService.get(cookieKey).userId;
                }
            }
            return result;
        };
        
        UserSessionService.isTokenValid = function () {
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: ServerService.baseUrl + 'users/me',
                headers: UserSessionService.headers()
            })
                    .success(function (user) {
                        deferred.resolve(true);
                    })
                    .error(function (error) {
                        var sessionValid = null;
                        if (error && error.code === 101) {
                            sessionValid = false;
                        }
                        deferred.resolve(sessionValid);
                    });
            return deferred.promise;
        };
        
        UserSessionService.sessionToken = function(){            
            var result = null;
            if(sessionInfos && sessionInfos.sessionToken){
                result = sessionInfos.sessionToken;
            }else{
                if(localStorageService.get(cookieKey) && localStorageService.get(cookieKey).sessionToken){
                    result = localStorageService.get(cookieKey).sessionToken;
                }
            }
            return result;            
        };
        
        UserSessionService.userId = function(){
            var result = null;
            if(sessionInfos && sessionInfos.userId){
                result = sessionInfos.userId;
            }else{
                if(localStorageService.get(cookieKey) && localStorageService.get(cookieKey).userId){
                    result = localStorageService.get(cookieKey).userId;
                }
            }
            return result;
        };
        
        
        UserSessionService.ownerReadWriteACL = function () {
            var ownerReadWriteACL = {};            
            var userId = UserSessionService.userId();
            ownerReadWriteACL[userId] = {};
            ownerReadWriteACL[userId].read = true;
            ownerReadWriteACL[userId].write = true;            
            return ownerReadWriteACL;
        };

        UserSessionService.everyoneReadACL = function () {
            return {
                "*": "read"
            };
        };

        UserSessionService.headers = function () {
            var headers = {
                "Content-Type": "application/json",
                "X-Parse-Application-Id": ServerService.applicationId,
                "X-Parse-REST-API-Key": ServerService.restApiKey
            };
            if (UserSessionService.sessionToken()) {
                headers["X-Parse-Session-Token"] = UserSessionService.sessionToken();
            }
            return headers;
        };        
        
        
        
        return UserSessionService;
}]);

