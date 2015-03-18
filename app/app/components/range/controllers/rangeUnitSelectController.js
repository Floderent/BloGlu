(function () {
    'use strict';

    angular.module('bloglu.range')
            .controller('rangeUnitSelectController', rangeUnitSelectController);

    rangeUnitSelectController.$inject = ['$scope'];


    function rangeUnitSelectController($scope) {
        
        var vm = this;
        
        $scope.$watch('range.isEdit', function (newValue, oldValue) {
            if (newValue) {
                angular.forEach(vm.units, function (unit) {
                    if (unit.objectId === vm.range.unit.objectId) {
                        vm.editedRangeUnit = unit;
                    }
                });
            }
        });
        $scope.$watch('editedRangeUnit', function (newValue, oldValue) {
            if (newValue && oldValue && newValue !== oldValue) {
                if (vm.range && vm.range.lowerLimit !== null) {
                    vm.range.lowerLimit = vm.range.lowerLimit * oldValue.coefficient / newValue.coefficient;
                }
                if (vm.range && vm.range.upperLimit !== null) {
                    vm.range.upperLimit = vm.range.upperLimit * oldValue.coefficient / newValue.coefficient;
                }
                vm.range.unit = newValue;
            }
        });
    }
})();