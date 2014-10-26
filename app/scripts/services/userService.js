'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('UserService', ['$http','$rootScope', 'ipCookie', '$q', 'ServerService', 'Database', 'AUTH_EVENTS', function ($http, $rootScope, ipCookie, $q, ServerService, AUTH_EVENTS) {
        var UserService = {};
        var user;
        UserService.signUp = function (user) {
            return $http.post(
                    ServerService.baseUrl + 'users',
                    user,
                    {
                        headers: UserService.headers()
                    });
        };

        UserService.logIn = function (username, password) {
            return $http.get(
                    ServerService.baseUrl + 'login',
                    {
                        headers: ServerService.headers,
                        params: {
                            'username': username,
                            'password': password
                        }
                    }
            ).success(function (result) {
                delete result.email;
                ipCookie('user', result, {expire: 7});
                user = result;
                return result;
            })
                    .error(function (error) {
                        return error;
                    });

        };
        UserService.logOut = function () {
            user = null;
            ipCookie.remove('user');
        };


        UserService.requestPasswordReset = function (email) {
            return $http({
                method: 'POST',
                url: ServerService.baseUrl + 'requestPasswordReset',
                data: angular.toJson({'email': email}),
                headers: ServerService.headers
            });
        };

        UserService.currentUser = function () {
            return user || ipCookie('user');
        };

        UserService.updateUser = function (updatedUser) {            
            var deferred = $q.defer();
            if (updatedUser && updatedUser.objectId) {                
                $http({
                    method: 'PUT',
                    url: ServerService.baseUrl + 'users/' + updatedUser.objectId,
                    data: updatedUser
                })
                        .success(function () {
                            if (UserService.currentUser() && updatedUser) {
                                user = angular.extend(user, updatedUser);
                            }
                            if (ipCookie('user')) {
                                var cookieUser = ipCookie('user');
                                if (cookieUser) {
                                    cookieUser = angular.extend(cookieUser, updatedUser);
                                }
                                delete cookieUser.email;
                                ipCookie('user', cookieUser, {expire: 7});
                            }
                            deferred.resolve(user);
                        })
                        .error(function (error) {
                            deferred.reject(error);
                        });
            }
            return deferred.promise;
        };

        UserService.deleteUser = function (user) {
            var deferred = $q.defer();
            if (user && user.objectId) {
                $http({
                    method: 'DELETE',
                    url: ServerService.baseUrl + 'users/' + user.objectId
                })
                        .success(function (response) {
                            deferred.resolve(response);
                        })
                        .error(function (error) {
                            deferred.reject(error);
                        });
            }
            return deferred.promise;
        };


        UserService.isAuthenticated = function () {
            return UserService.currentUser() && UserService.currentUser().sessionToken;
        };

        UserService.isTokenValid = function () {
            var deferred = $q.defer();
            $http({
                method: 'GET',
                url: ServerService.baseUrl + 'users/me',
                headers: UserService.headers()
            })
                    .success(function (user) {
                        deferred.resolve(true);
                    })
                    .error(function (error) {
                        var sessionValid = true;
                        if (error && error.code === 101) {
                            sessionValid = false;
                        }
                        deferred.resolve(sessionValid);
                    });
            return deferred.promise;
        };


        UserService.ownerReadWriteACL = function () {
            var ownerReadWriteACL = {};
            if (UserService.currentUser()) {
                var user = UserService.currentUser();
                ownerReadWriteACL[user.objectId] = {};
                ownerReadWriteACL[user.objectId].read = true;
                ownerReadWriteACL[user.objectId].write = true;
            }
            return ownerReadWriteACL;
        };

        UserService.everyoneReadACL = function () {
            return {
                "*": "read"
            };
        };

        UserService.headers = function () {
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

        UserService.getFirstDayOfWeek = function () {
            var firstDayOfWeek = 0;
            if (UserService.currentUser().preferences && UserService.currentUser().preferences.firstDayOfWeek) {
                firstDayOfWeek = UserService.currentUser().preferences.firstDayOfWeek;
            }
            return firstDayOfWeek;
        };
        return UserService;
    }]);

