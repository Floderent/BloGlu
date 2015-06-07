(function () {
    'use strict';

    angular.module('bloglu.userPreferences')
            .controller('userPreferencesController', userPreferencesController);

    userPreferencesController.$inject = ['$q', '$rootScope', '$scope', 'dateUtil', 'MessageService', 'ResourceName', 'unitService', 'UserService', 'Utils'];

    function userPreferencesController($q, $rootScope, $scope,dateUtil, MessageService, ResourceName, unitService, UserService, Utils) {
        $rootScope.messages = [];
        $rootScope.pending = 0;
        
        var vm = this;
        vm.eventsTypes = ResourceName;
        delete vm.eventsTypes["0"];

        vm.user = {};
        vm.days = dateUtil.getCurrentWeekSundayAndMonday();
        vm.units = [];
        vm.deleteUser = deleteUser;        
        vm.update = update;

        renderPage();

        function renderPage() {
            return initUser().then(initResourceUnits);
        }

        function initUser() {
            return UserService.getCurrentUser().then(function (currentUser) {
                vm.user = currentUser;
                initPreferences();
                return;
            });
        }

        function initPreferences() {
            if (!vm.user.preferences) {
                vm.user.preferences = {};
            }
            if (vm.user && vm.user.preferences && typeof vm.user.preferences.firstDayOfWeek === 'undefined' && vm.user.preferences.firstDayOfWeek === null) {
                vm.user.preferences.firstDayOfWeek = 0;
            }
            if (!vm.user.preferences.defaultUnits) {
                vm.user.preferences.defaultUnits = {};
            }
        }

        function initResourceUnits() {
            var promiseArray = [];
            angular.forEach(ResourceName, function (value, key) {
                promiseArray.push(unitService.getUnitsByCode(parseInt(key)).then(function (result) {
                    vm.units[value] = result;
                    //if no previous unit set, use reference unit
                    if (!vm.user.preferences.defaultUnits[value] && result && result.length > 0) {
                        vm.user.preferences.defaultUnits[value] = unitService.getReferenceUnit(result);
                    }
                    return;
                }));
            });
            return $q.all(promiseArray);
        }

        function update(user) {
            $rootScope.increasePending("processingMessage.updatingData");
            UserService.saveUser(user).then(function (result) {
                $rootScope.messages.push(MessageService.successMessage("successMessage.userUpdated", 2000));
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage('errorMessage.updatingError', 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.updatingData");
            });
        }

        function deleteUser(user) {
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
        }
        var unbind = $rootScope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();