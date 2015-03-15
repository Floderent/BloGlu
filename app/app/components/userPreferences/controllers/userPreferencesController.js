(function () {
    'use strict';

    angular.module('bloglu.userPreferences')
            .controller('userPreferencesController', userPreferencesController);

    userPreferencesController.$inject = [
        '$q',
        '$rootScope',
        '$scope',
        'dateUtil',
        'MessageService',
        'ResourceName',
        'unitService',
        'UserService',
        'Utils'];

    function userPreferencesController(
            $q,
            $rootScope,
            $scope,
            dateUtil,
            MessageService,
            ResourceName,
            unitService,
            UserService,
            Utils) {
        $rootScope.messages = [];
        $rootScope.pending = 0;

        $scope.eventsTypes = ResourceName;
        delete $scope.eventsTypes["0"];

        $scope.user = {};
        $scope.days = dateUtil.getCurrentWeekSundayAndMonday();
        $scope.units = [];

        renderPage();

        function renderPage() {
            return initUser().then(initResourceUnits);
        }

        function initUser() {
            return UserService.getCurrentUser().then(function (currentUser) {
                $scope.user = currentUser;
                initPreferences();
                return;
            });
        }

        function initPreferences() {
            if (!$scope.user.preferences) {
                $scope.user.preferences = {};
            }
            if ($scope.user && $scope.user.preferences && typeof $scope.user.preferences.firstDayOfWeek === 'undefined' && $scope.user.preferences.firstDayOfWeek === null) {
                $scope.user.preferences.firstDayOfWeek = 0;
            }
            if (!$scope.user.preferences.defaultUnits) {
                $scope.user.preferences.defaultUnits = {};
            }
        }

        function initResourceUnits() {
            var promiseArray = [];
            angular.forEach(ResourceName, function (value, key) {
                promiseArray.push(unitService.getUnitsByCode(parseInt(key)).then(function (result) {
                    $scope.units[value] = result;
                    //if no previous unit set, use reference unit
                    if (!$scope.user.preferences.defaultUnits[value] && result && result.length > 0) {
                        $scope.user.preferences.defaultUnits[value] = unitService.getReferenceUnit(result);
                    }
                    return;
                }));
            });
            return $q.all(promiseArray);
        }

        $scope.update = function (user) {
            $rootScope.increasePending("processingMessage.updatingData");
            UserService.saveUser(user).then(function (result) {
                $rootScope.messages.push(MessageService.successMessage("successMessage.userUpdated", 2000));
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage('errorMessage.updatingError', 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.updatingData");
            });
        };

        $scope.delete = function (user) {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: 'userPreferences.confirmDeletion',
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                $rootScope.increasePending("processingMessage.deletingData");
                UserService.deleteUser(user).then(function () {
                    $rootScope.logOut();
                }, function (error) {
                    $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                })['finally'](function () {
                    $rootScope.decreasePending("processingMessage.deletingData");
                });
            }, function () {
                //exit
            });
        };

        $rootScope.$on('dataReady', renderPage);

    }
})();