(function () {
    'use strict';

    angular.module('bloglu.range')
            .controller('rangeController', rangeController);

    rangeController.$inject = ['menuHeaderService', '$scope', '$q', 'MessageService', 'unitService', 'Utils', 'rangeService', 'translationService'];

    function rangeController(menuHeaderService, $scope, $q, MessageService, unitService, Utils, rangeService, translationService) {

        var vm = this;
        vm.newRange = {};
        vm.ranges = [];
        vm.units = [];
        vm.defaultUnit = null;
        vm.loadingState = menuHeaderService.loadingState;

        vm.getLowerLimit = getLowerLimit;
        vm.saveRange = saveRange;
        vm.updateRange = updateRange;
        vm.deleteRange = deleteRange;
        vm.editRange = editRange;
        vm.cancelEditRange = cancelEditRange;
        vm.changeUnit = changeUnit;
        vm.rangeUnitChange = rangeUnitChange;
        
        vm.colorPickerOptions = {
            showPalette: true, 
            preferredFormat: 'hex', 
            chooseText: translationService.translate('range.selectColor'), 
            cancelText: translationService.translate('range.cancelColor')
        };

        var eventCode = 1;

        renderPage();

        function renderPage() {
            menuHeaderService.increasePending("processingMessage.loading");
            $q.all([
                rangeService.getRanges(),
                unitService.getUnitsByCode(eventCode),
                rangeService.getDefaultUnit()
            ]).then(function (results) {
                vm.ranges = results[0];
                vm.units = results[1];
                vm.defaultUnit = results[2];
                handleNewRangeUnit();
                vm.newRange = rangeService.processRanges(vm.ranges, vm.newRange.unit);               
            }, function (error) {
                MessageService.errorMessage("errorMessage.loadingError", 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending("processingMessage.loading");
            });

        }


        function handleNewRangeUnit() {
            if (!vm.newRange.unit && vm.defaultUnit) {
                angular.forEach(vm.units, function (unit) {
                    if (unit.objectId === vm.defaultUnit.objectId) {
                        vm.newRange.unit = unit;
                        return;
                    }
                });
            }
            if (!vm.newRange.unit && vm.units.length > 0) {
                vm.newRange.unit = vm.units[0];
            }
        }


        function changeUnit(newUnit, oldUnitId) {
            if (newUnit && (newUnit.objectId !== oldUnitId) && vm.newRange) {
                unitService.getUnitById(oldUnitId).then(function (oldUnit) {
                    if (vm.newRange.lowerLimit) {
                        vm.newRange.lowerLimit = vm.newRange.lowerLimit * oldUnit.coefficient / newUnit.coefficient;
                    }
                    if (vm.newRange.upperLimit) {
                        vm.newRange.upperLimit = vm.newRange.upperLimit * oldUnit.coefficient / newUnit.coefficient;
                    }

                });
            }
        }

        function rangeUnitChange(range, oldUnitId) {
            unitService.getUnitById(oldUnitId).then(function (oldUnit) {
                if (range && range.lowerLimit !== null) {
                    range.lowerLimit = range.lowerLimit * oldUnit.coefficient / range.unit.coefficient;
                }
                if (range && range.upperLimit !== null) {
                    range.upperLimit = range.upperLimit * oldUnit.coefficient / range.unit.coefficient;
                }
            });
        }


        function checkRanges(existingPeriods, newPeriod) {
            var errorMessages = rangeService.checkRanges(existingPeriods, newPeriod);
            angular.forEach(errorMessages, function (errorMessage) {
                MessageService.errorMessage(errorMessage, 2000);
            });
            return errorMessages.length === 0;
        }


        function getLowerLimit(range) {
            return range.lowerLimit;
        }


        function saveRange(range) {
            if (range && range.lowerLimit !== null && range.upperLimit !== null) {
                if (checkRanges(vm.ranges, range)) {
                    menuHeaderService.increasePending("processingMessage.savingData");
                    rangeService.saveRange(range, false).then(function (result) {
                        angular.extend(range, result);
                        vm.ranges.push(range);
                        vm.newRange = rangeService.processRanges(vm.ranges, vm.newRange.unit);
                        MessageService.successMessage("successMessage.rangeCreated", 2000);
                    }, function (error) {
                        MessageService.errorMessage("errorMessage.creatingError", 2000);
                    })['finally'](function () {
                        menuHeaderService.decreasePending("processingMessage.savingData");
                    });
                }
            }
        }

        function updateRange(range) {
            if (!checkRanges(vm.ranges)) {
                vm.cancelEditRange(range);
            } else {
                if (range.objectId) {
                    menuHeaderService.increasePending("processingMessage.updatingData");
                    rangeService.saveRange(range, true).then(function (result) {
                        range.isEdit = false;
                        vm.newRange = rangeService.processRanges(vm.ranges, vm.newRange.unit);
                        MessageService.successMessage("successMessage.rangeUpdated", 2000);
                    }, function (error) {
                        vm.cancelEditRange(range);
                        MessageService.errorMessage("errorMessage.updatingError", 2000);
                    })['finally'](function () {
                        menuHeaderService.decreasePending("processingMessage.updatingData");
                    });
                }
            }
        }


        function deleteRange(range) {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: 'confirm.deletionMessage',
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    if (range.objectId) {
                        menuHeaderService.increasePending("processingMessage.deletingData");
                        rangeService.deleteRange(range).then(function (result) {
                            var rangeIndex = -1;
                            angular.forEach(vm.ranges, function (rg, index) {
                                if (rg.objectId && rg.objectId === range.objectId) {
                                    rangeIndex = index;
                                }
                            });
                            if (rangeIndex !== -1) {
                                vm.ranges.splice(rangeIndex, 1);
                            }
                            vm.newRange = rangeService.processRanges(vm.ranges, vm.newRange.unit);
                        }, function (error) {
                            MessageService.errorMessage('errorMessage.deletingError', 2000);
                        })['finally'](function () {
                            menuHeaderService.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function () {
                //exit
            });

        }


        function editRange(range) {
            range.isEdit = true;
            range.original = angular.extend({}, range);
        }
     

        function cancelEditRange(range) {
            range.isEdit = false;
            range.unit = range.original.unit;
            range.lowerLimit = range.original.lowerLimit;
            range.upperLimit = range.original.upperLimit;
            range.normal = range.original.normal;
            range.color = range.original.color;
            delete range.original;
        }
     

        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();