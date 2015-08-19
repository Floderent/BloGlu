(function () {
    'use strict';

    angular.module('bloglu.utils')
            .factory('UserService', UserService);

    UserService.$inject = ['$q', 'genericDaoService', 'UserSessionService'];


    function UserService($q, genericDaoService, UserSessionService) {
        
        var resourceName = 'User';
        var UserService = {
            saveUser: saveUser,
            getUser: getUser,
            getCurrentUser: getCurrentUser,
            getPreferences: getPreferences,
            deleteUser: deleteUser,
            getFirstDayOfWeek: getFirstDayOfWeek,
            getDefaultUnits: getDefaultUnits,
            getDefaultUnit: getDefaultUnit
        };
        return UserService;        

        function saveUser(user) {
            return genericDaoService.save(resourceName, user, true);
        }

        function getUser(userId) {
            return genericDaoService.get(resourceName, userId).then(function (user) {
                return user;
            });
        }

        function getCurrentUser() {
            return genericDaoService.get(resourceName, UserSessionService.getUserId()).then(function (user) {
                return user;
            });
        }

        function getPreferences() {
            return $q(function (resolve, reject) {
                UserService.getCurrentUser().then(function (currentUser) {
                    if (currentUser && currentUser.preferences) {
                        resolve(currentUser.preferences);
                    } else {
                        resolve(null);
                    }
                }, reject);
            });
        }

        function deleteUser(user) {
            return genericDaoService.remove(resourceName, user);
        }

        function getFirstDayOfWeek() {
            var firstDayOfWeek = 0;
            return $q(function (resolve, reject) {
                UserService.getPreferences().then(function (preferences) {
                    if (preferences && preferences.firstDayOfWeek) {
                        resolve(preferences.firstDayOfWeek);
                    } else {
                        resolve(firstDayOfWeek);
                    }
                }, reject);
            });
        }

        function getDefaultUnits() {
            var defaultUnits = null;
            return $q(function (resolve, reject) {
                UserService.getPreferences().then(function (preferences) {
                    if (preferences && preferences.defaultUnits) {
                        resolve(preferences.defaultUnits);
                    } else {
                        resolve(defaultUnits);
                    }
                }, reject);
            });
        }


        function getDefaultUnit(resourceName) {
            return $q(function (resolve, reject) {
                UserService.getDefaultUnits().then(function (defaultUnits) {
                    if (defaultUnits) {
                        resolve(defaultUnits[resourceName]);
                    } else {
                        resolve(null);
                    }
                }, reject);
            });
        }


        return UserService;
    }
})();