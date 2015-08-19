(function () {
    'use strict';

    angular.module('bloglu.userPreferences')
            .controller('userPreferencesController', userPreferencesController);

    userPreferencesController.$inject = ['$q', 'menuHeaderService', '$scope', 'dateUtil', 'MessageService', 'ResourceName', 'unitService', 'UserService', 'UserSessionService', 'Utils'];

    function userPreferencesController($q, menuHeaderService, $scope,dateUtil, MessageService, ResourceName, unitService, UserService, UserSessionService, Utils) {
        
        menuHeaderService.pending = 0;
        
        var vm = this;
        vm.eventsTypes = ResourceName;
        delete vm.eventsTypes['0'];

        vm.user = {};
        vm.loadingState = menuHeaderService.loadingState;        
        vm.days = dateUtil.getCurrentWeekSundayAndMonday();
        vm.units = [];
        vm.deleteUser = deleteUser;        
        vm.update = update;

        renderPage();

        function renderPage() {            
            vm.user = UserSessionService.getCurrentUser();
            initPreferences();
            return initResourceUnits();
        }      
       
        function initPreferences() {          
            if (!vm.user.preferences) {
                vm.user.preferences = {};
            }
            if (!vm.user.preferences.firstDayOfWeek) {
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
            menuHeaderService.increasePending('processingMessage.updatingData');
            UserService.saveUser(user).then(function (result) {
                MessageService.successMessage('successMessage.userUpdated', 2000);
            }, function (error) {
               MessageService.errorMessage('errorMessage.updatingError', 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending('processingMessage.updatingData');
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
                menuHeaderService.increasePending('processingMessage.deletingData');                
                UserService.deleteUser(user).then(function () {
                    menuHeaderService.logOut();
                }, function (error) {
                    MessageService.errorMessage('errorMessage.deletingError', 2000);
                })['finally'](function () {
                    menuHeaderService.decreasePending('processingMessage.deletingData');
                });
            }, function () {
                //exit
            });
        }
        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();