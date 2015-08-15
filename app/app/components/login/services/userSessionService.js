(function () {
    'use strict';

    angular.module('bloglu.login')
            .factory('UserSessionService', UserSessionService);

    UserSessionService.$inject = ['$http', '$modal', 'localStorageService', 'ServerService'];

    function UserSessionService($http, $modal, localStorageService, ServerService) {

        var UserSessionService = {
            cookieKey: 'sessionInfos',
            sessionInfos: null,            
            signUp: signUp,            
            logIn: logIn,
            getCurrentUser: getCurrentUser,
            isAuthenticated: isAuthenticated,
            requestPasswordReset: requestPasswordReset,
            logOut: logOut,
            sessionToken: sessionToken,
            getUserId: getUserId,
            isTokenValid: isTokenValid,
            ownerReadWriteACL: ownerReadWriteACL,
            everyoneReadACL: everyoneReadACL,
            headers: headers,            
            displaySignUpModal: displaySignUpModal,
            displayResetPasswordModal: displayResetPasswordModal
        };        
        return UserSessionService;


        function signUp(user) {
            return $http.post(ServerService.baseUrl + 'users', user, {headers: ServerService.headers});
        }

        function logIn(username, password) {            
            return $http.get(ServerService.baseUrl + 'login', {headers: ServerService.headers, params: {'username': username, 'password': password}}).then(function (response) {
                var user = response.data;                
                delete user.email;
                UserSessionService.sessionInfos = {
                    sessionToken: user.sessionToken,
                    userId: user.objectId,
                    user: user
                };                
                localStorageService.set(UserSessionService.cookieKey, UserSessionService.sessionInfos);
                return UserSessionService.sessionInfos;
            });
        }
        
        function getCurrentUser(){
            var user = null;
            if(UserSessionService.sessionInfos && UserSessionService.sessionInfos.user){
                user = UserSessionService.sessionInfos.user;
            }else{
                if(localStorageService.get(UserSessionService.cookieKey) && localStorageService.get(UserSessionService.cookieKey).user){
                    user = localStorageService.get(UserSessionService.cookieKey).user;
                }
            }            
            return user;
        }
        
        function isAuthenticated() {
            return UserSessionService.getUserId() && UserSessionService.sessionToken();
        }

        function requestPasswordReset(email) {
            return $http({
                method: 'POST',
                url: ServerService.baseUrl + 'requestPasswordReset',
                data: angular.toJson({'email': email}),
                headers: ServerService.headers
            });
        }

        function logOut() {
            UserSessionService.sessionInfos = null;
            localStorageService.remove(UserSessionService.cookieKey);
        }

        function sessionToken() {
            var result = null;
            if (UserSessionService.sessionInfos && UserSessionService.sessionInfos.sessionToken) {
                result = UserSessionService.sessionInfos.sessionToken;
            } else {
                if (localStorageService.get(UserSessionService.cookieKey) && localStorageService.get(UserSessionService.cookieKey).sessionToken) {
                    result = localStorageService.get(UserSessionService.cookieKey).sessionToken;
                }
            }
            return result;
        }

        function getUserId() {
            var result = null;
            if (UserSessionService.sessionInfos && UserSessionService.sessionInfos.userId) {
                result = UserSessionService.sessionInfos.userId;
            } else {
                if (localStorageService.get(UserSessionService.cookieKey) && localStorageService.get(UserSessionService.cookieKey).userId) {
                    result = localStorageService.get(UserSessionService.cookieKey).userId;
                }
            }
            return result;
        }

        function isTokenValid() {
            return $http({
                method: 'GET',
                url: ServerService.baseUrl + 'users/me',
                headers: UserSessionService.headers()
            }).then(function (user) {
                return true;
            }, function (error) {
                var sessionValid = null;
                if (error && error.code === 101) {
                    sessionValid = false;
                }
                return sessionValid;
            });
        }

        function ownerReadWriteACL() {
            var ownerReadWriteACL = {};
            var userId = UserSessionService.getUserId();
            ownerReadWriteACL[userId] = {};
            ownerReadWriteACL[userId].read = true;
            ownerReadWriteACL[userId].write = true;
            return ownerReadWriteACL;
        }
     

        function everyoneReadACL() {
            return {
                "*": "read"
            };
        }
     

        function headers() {
            var headers = {
                "Content-Type": "application/json",
                "X-Parse-Application-Id": ServerService.applicationId,
                "X-Parse-REST-API-Key": ServerService.restApiKey
            };
            if (UserSessionService.sessionToken()) {
                headers["X-Parse-Session-Token"] = UserSessionService.sessionToken();
            }
            return headers;
        }

        function displaySignUpModal() {
            $modal.open({
                templateUrl: 'app/components/login/templates/inputUser.html',
                controller: 'inputUserController as vm'
            });
        }
     

        function displayResetPasswordModal() {
            $modal.open({
                templateUrl: 'app/components/login/templates/resetPassword.html',
                controller: 'resetPasswordController as vm'
            });
        }
     

    }
})();