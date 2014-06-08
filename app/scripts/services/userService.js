'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('UserService', ['$http', '$cookieStore', 'ServerService', 'indexeddbService', function($http, $cookieStore, ServerService, indexeddbService) {
        var UserService = {};
        var user;
        UserService.signUp = function(user) {
            return $http.post(
                    ServerService.baseUrl + 'users',
                    user,
                    {
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                //data.ACL = UserService.ownerReadWriteACL();
                            }
                            return angular.toJson(data);
                        }
                    });
        };

        UserService.logIn = function(username, password) {
            return $http.get(
                    ServerService.baseUrl + 'login',
                    {
                        headers: ServerService.headers,
                        params: {
                            'username': username,
                            'password': password
                        }
                    }
            ).success(function(result) {
                $cookieStore.put('user', result);                
                $cookieStore.put('sessionToken', result.sessionToken);
                user = result;
                //headers["X-Parse-Session-Token"] = result.sessionToken;
                return result;
            })
                    .error(function(error) {
                        return error;
                    });

        };
        UserService.logOut = function() {
            user = null;
            indexeddbService.dropDatabase().then(function() {
                $cookieStore.remove('user');
                $cookieStore.remove('sessionToken');
            }, function(error) {
                $cookieStore.remove('user');
                $cookieStore.remove('sessionToken');
            });
        };


        UserService.requestPasswordReset = function(email) {
            debugger;
            return $http({
                method: 'POST',
                url: ServerService.baseUrl + 'requestPasswordReset',
                data: angular.toJson({'email': email}),
                headers: ServerService.headers
            });
        };

        UserService.currentUser = function() {
            return user || $cookieStore.get('user');
        };

        UserService.updateUser = function(updatedUser) {
            if (user && updatedUser) {
                user = angular.extend(user, updatedUser);
            }
            if ($cookieStore.get('user')) {
                var cookieUser = $cookieStore.get('user');
                if (cookieUser) {
                    cookieUser = angular.extend(cookieUser, updatedUser);
                }
                $cookieStore.put('user', cookieUser);
            }
        };


        UserService.ownerReadWriteACL = function() {
            var ownerReadWriteACL = {};
            if (UserService.currentUser()) {
                var user = UserService.currentUser();
                ownerReadWriteACL[user.objectId] = {};
                ownerReadWriteACL[user.objectId].read = true;
                ownerReadWriteACL[user.objectId].write = true;
            }
            return ownerReadWriteACL;
        };

        UserService.everyoneReadACL = function() {
            return {
                "*": "read"
            };
        };

        UserService.headers = function() {
            var headers = {
                "Content-Type": "application/json",
                "X-Parse-Application-Id": ServerService.applicationId,
                "X-Parse-REST-API-Key": ServerService.restApiKey
            };
            if (UserService.currentUser() && UserService.currentUser().sessionToken) {
                headers["X-Parse-Session-Token"] = UserService.currentUser().sessionToken;
            }
            return headers;
        };

        UserService.getFirstDayOfWeek = function() {
            var firstDayOfWeek = 0;
            if (UserService.currentUser().preferences && UserService.currentUser().preferences.firstDayOfWeek) {
                firstDayOfWeek = UserService.currentUser().preferences.firstDayOfWeek;
            }
            return firstDayOfWeek;
        };
        return UserService;
    }]);

