(function () {
    'use strict';

    angular.module('bloglu.range')
            .controller('rangeController', rangeController);

    rangeController.$inject = ['$scope', '$rootScope', '$q', 'MessageService', 'unitService', 'Utils', 'rangeService'];

    function rangeController($scope, $rootScope, $q, MessageService, unitService, Utils, rangeService) {

        $scope.newRange = {};
        var eventCode = 1;

        renderPage();

        function renderPage() {
            $rootScope.increasePending("processingMessage.loading");
            $q.all([
                rangeService.getRanges(),
                unitService.getUnitsByCode(eventCode),
                rangeService.getDefaultUnit()
            ]).then(function (results) {
                $scope.ranges = results[0];
                $scope.units = results[1];
                $scope.defaultUnit = results[2];
                handleNewRangeUnit();
                $scope.newRange = rangeService.processRanges($scope.ranges, $scope.newRange.unit);
                $scope.$watch('ranges', function (newValue, oldValue) {
                    $scope.newRange = rangeService.processRanges($scope.ranges, $scope.newRange.unit);
                }, true);
            }, function (error) {
                $rootScope.messages.push(MessageService.errorMessage("errorMessage.loadingError", 2000));
            })['finally'](function () {
                $rootScope.decreasePending("processingMessage.loading");
            });

        }


        function handleNewRangeUnit() {
            if (!$scope.newRange.unit && $scope.defaultUnit) {
                angular.forEach($scope.units, function (unit) {
                    if (unit.objectId === $scope.defaultUnit.objectId) {
                        $scope.newRange.unit = unit;
                        return;
                    }
                });
            }
            if (!$scope.newRange.unit && $scope.units.length > 0) {
                $scope.newRange.unit = $scope.units[0];
            }
            $scope.$watch('newRange.unit', function (newValue, oldValue) {
                if (newValue && oldValue) {
                    if ($scope.newRange && $scope.newRange.lowerLimit) {
                        $scope.newRange.lowerLimit = $scope.newRange.lowerLimit * oldValue.coefficient / newValue.coefficient;
                    }
                    if ($scope.newRange && $scope.newRange.upperLimit) {
                        $scope.newRange.upperLimit = $scope.newRange.upperLimit * oldValue.coefficient / newValue.coefficient;
                    }
                }
            });
        }

        function checkRanges(existingPeriods, newPeriod) {
            var errorMessages = rangeService.checkRanges(existingPeriods, newPeriod);
            angular.forEach(errorMessages, function (errorMessage) {
                $rootScope.messages.push(MessageService.errorMessage(errorMessage, 2000));
            });
            return errorMessages.length === 0;
        }


        $scope.getLowerLimit = function (range) {
            return range.lowerLimit;
        };


        $scope.saveRange = function (range) {
            if (range && range.lowerLimit !== null && range.upperLimit !== null) {
                if (checkRanges($scope.ranges, range)) {
                    $rootScope.increasePending("processingMessage.savingData");
                    rangeService.saveRange(range, false).then(function (result) {
                        angular.extend(range, result);
                        $scope.ranges.push(range);
                        $scope.newRange = rangeService.processRanges($scope.ranges, $scope.newRange.unit);
                        $rootScope.messages.push(MessageService.successMessage("successMessage.rangeCreated", 2000));
                    }, function (error) {
                        $rootScope.messages.push(MessageService.errorMessage("errorMessage.creatingError", 2000));
                    })['finally'](function () {
                        $rootScope.decreasePending("processingMessage.savingData");
                    });
                }
            }
        };

        $scope.updateRange = function (range) {
            if (!checkRanges($scope.ranges)) {
                $scope.cancelEditRange(range);
            } else {
                if (range.objectId) {
                    $rootScope.increasePending("processingMessage.updatingData");
                    rangeService.saveRange(range, true).then(function (result) {
                        range.isEdit = false;
                        $scope.newRange = rangeService.processRanges($scope.ranges, $scope.newRange.unit);
                        $rootScope.messages.push(MessageService.successMessage("successMessage.rangeUpdated", 2000));
                    }, function (error) {
                        $scope.cancelEditRange(range);
                        $rootScope.messages.push(MessageService.errorMessage("errorMessage.updatingError", 2000));
                    })['finally'](function () {
                        $rootScope.decreasePending("processingMessage.updatingData");
                    });
                }
            }
        };


        $scope.deleteRange = function (range) {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: 'confirm.deletionMessage',
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    if (range.objectId) {
                        $rootScope.increasePending("processingMessage.deletingData");
                        rangeService.deleteRange(range).then(function (result) {
                            var rangeIndex = -1;
                            angular.forEach($scope.ranges, function (rg, index) {
                                if (rg.objectId && rg.objectId === range.objectId) {
                                    rangeIndex = index;
                                }
                            });
                            if (rangeIndex !== -1) {
                                $scope.ranges.splice(rangeIndex, 1);
                            }
                            $scope.newRange = rangeService.processRanges($scope.ranges, $scope.newRange.unit);
                        }, function (error) {
                            $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                        })['finally'](function () {
                            $rootScope.decreasePending("processingMessage.deletingData");
                        });
                    }
                }
            }, function () {
                //exit
            });

        };


        $scope.editRange = function (range) {
            range.isEdit = true;
            range.original = angular.extend({}, range);
        };

        $scope.cancelEditRange = function (range) {
            range.isEdit = false;
            range.unit = range.original.unit;
            range.lowerLimit = range.original.lowerLimit;
            range.upperLimit = range.original.upperLimit;
            range.normal = range.original.normal;
            range.color = range.original.color;
            delete range.original;
        };

        $rootScope.$on('dataReady', renderPage);
    }
})();