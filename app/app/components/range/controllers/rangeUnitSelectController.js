(function () {
    'use strict';

    angular.module('bloglu.range')
            .controller('rangeUnitSelectController', rangeUnitSelectController);

    rangeUnitSelectController.$inject = ['$scope'];


    function rangeUnitSelectController($scope) {
        $scope.$watch('range.isEdit', function (newValue, oldValue) {
            if (newValue) {
                angular.forEach($scope.units, function (unit) {
                    if (unit.objectId === $scope.range.unit.objectId) {
                        $scope.editedRangeUnit = unit;
                    }
                });
            }
        });
        $scope.$watch('editedRangeUnit', function (newValue, oldValue) {
            if (newValue && oldValue && newValue !== oldValue) {
                if ($scope.range && $scope.range.lowerLimit !== null) {
                    $scope.range.lowerLimit = $scope.range.lowerLimit * oldValue.coefficient / newValue.coefficient;
                }
                if ($scope.range && $scope.range.upperLimit !== null) {
                    $scope.range.upperLimit = $scope.range.upperLimit * oldValue.coefficient / newValue.coefficient;
                }
                $scope.range.unit = newValue;
            }
        });
    }
})();