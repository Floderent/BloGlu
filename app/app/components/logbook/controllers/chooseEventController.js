(function () {
    'use strict';

    angular.module('bloglu.logbook')
            .controller('chooseEventController', chooseEventController);

    chooseEventController.$inject = ['$scope', '$modalInstance'];

    function chooseEventController($scope, $modalInstance) {
        $scope.code = null;
        $scope.selectType = function (key) {
            $scope.code = parseInt(key);
        };
        $scope.ok = function () {
            $modalInstance.close($scope.code);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss(0);
        };
    }
})();
