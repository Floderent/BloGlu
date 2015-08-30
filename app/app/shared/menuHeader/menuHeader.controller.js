(function () {
    'use strict';

    angular.module('bloglu.menuHeader')
            .controller('menuHeaderController', MenuHeaderController);

    MenuHeaderController.$inject = ['$scope', 'UserSessionService', 'menuHeaderService', 'searchService', 'AUTH_EVENTS'];

    function MenuHeaderController($scope, UserSessionService, menuHeaderService, searchService, AUTH_EVENTS) {
        
        var vm = this;        
        
        vm.currentUser = null;        
        vm.loadingState = menuHeaderService.loadingState;        
        vm.logOut = menuHeaderService.logOut;
        vm.search = searchService.search;
        vm.formatEventForDisplay = searchService.formatEventForDisplay;
        vm.onEventSelect = onEventSelect;
                        
        activate();
        
        function activate(){            
            vm.currentUser = UserSessionService.getCurrentUser();
        }
        
        function onEventSelect(event){
            return searchService.displayEventInModal(event);
        }
        
        
        var unbindAuthConfirmed = $scope.$on(AUTH_EVENTS.loginSuccess, function (event) {            
            vm.currentUser = UserSessionService.getCurrentUser();            
        });

        var unbindLoginCancelled = $scope.$on(AUTH_EVENTS.notAuthenticated, function () {
            vm.currentUser = null;
        });

        $scope.$on('destroy', unbindAuthConfirmed);
        $scope.$on('destroy', unbindLoginCancelled);
        
        
    }
})();
