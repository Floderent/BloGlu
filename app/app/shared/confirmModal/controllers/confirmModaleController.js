(function () {
'use strict';

angular.module('bloglu.confirmModal')
        .controller('confirmModalController', confirmModalController);

confirmModalController.$inject = ['$scope', '$modalInstance'];

function confirmModalController($scope, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.close(1);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss(0);
        };
    }
})();
