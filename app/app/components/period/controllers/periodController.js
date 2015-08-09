(function () {
    'use strict';

    angular.module('bloglu.period')
            .controller('periodController', periodController);

    periodController.$inject = ['menuHeaderService', '$scope', 'MessageService', 'periodService', 'Utils'];

    function periodController(menuHeaderService, $scope, MessageService, periodService, Utils) {

        var vm = this;
        vm.periods = [];
        vm.newPeriod = null;
        vm.arePeriodsOnMoreThanOneDay = true;

        vm.getBeginDateHours = getBeginDateHours;
        vm.savePeriod = savePeriod;
        vm.updatePeriod = updatePeriod;
        vm.deletePeriod = deletePeriod;
        vm.editPeriod = editPeriod;
        vm.cancelEditPeriod = cancelEditPeriod;

        renderPage();

        function renderPage() {
            menuHeaderService.increasePending("processingMessage.loadingData");
            periodService.getPeriods().then(function (result) {
                vm.periods = result;
                processPeriods(vm.periods);
            }, function (error) {
                MessageService.errorMessage("errorMessage.loadingError", 2000);
            })['finally'](function () {
                menuHeaderService.decreasePending("processingMessage.loadingData");
            });
        }

        function processPeriods(periodArray) {
            checkPeriods(vm.periods);
            vm.arePeriodsOnMoreThanOneDay = periodService.arePeriodsOnMoreThanOneDay(periodArray);
            vm.newPeriod = periodService.getNewPeriod(periodArray);
        }

        function checkPeriods(existingPeriods, newPeriod) {
            var errorMessages = periodService.checkPeriods(existingPeriods, newPeriod);
            angular.forEach(errorMessages, function (errorMessage) {
                MessageService.errorMessage(errorMessage, 2000);
            });
            return errorMessages.length === 0;
        }

        function getBeginDateHours(period) {
            var beginDateHours = period.begin.getHours();
            var beginDateMinutes = period.begin.getMinutes();
            return beginDateHours * 60 + beginDateMinutes;
        }

        function savePeriod(period) {
            if (period && period.begin && period.end) {
                if (checkPeriods(vm.periods, period)) {
                    menuHeaderService.increasePending("processingMessage.savingData");
                    periodService.savePeriod(period).then(function (result) {
                        angular.extend(period, result);
                        vm.periods.push(period);
                        processPeriods(vm.periods);
                        MessageService.successMessage("successMessage.periodCreated", 2000);
                    }, function (error) {
                        MessageService.errorMessage("errorMessage.creatingError", 2000);
                    })['finally'](function () {
                        menuHeaderService.decreasePending("processingMessage.savingData");
                    });
                }
            }
        }

        function updatePeriod(period) {
            if (!checkPeriods(vm.periods)) {
                vm.cancelEditPeriod(period);
            } else {
                if (period.objectId) {
                    menuHeaderService.increasePending("processingMessage.updatingData");
                    periodService.savePeriod(period, true).then(function (result) {
                        period.isEdit = false;
                        processPeriods(vm.periods);
                        MessageService.successMessage("successMessage.periodUpdated", 2000);
                    }, function (error) {
                        vm.cancelEditPeriod(period);
                        MessageService.errorMessage("errorMessage.updatingError", 2000);
                    })['finally'](function () {
                        menuHeaderService.decreasePending("processingMessage.updatingData");
                    });

                }
            }
        }


        function deletePeriod(period) {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: {id: 'confirm.deletionMessageWithName', params: {objectName: period.name}},
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    if (period.objectId) {
                        menuHeaderService.increasePending("processingMessage.deletingData");
                        periodService.deletePeriod(period).then(function (result) {
                            var periodIndex = -1;
                            angular.forEach(vm.periods, function (per, index) {
                                if (per.objectId && per.objectId === period.objectId) {
                                    periodIndex = index;
                                }
                            });
                            if (periodIndex !== -1) {
                                vm.periods.splice(periodIndex, 1);
                            }
                            processPeriods(vm.periods);
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


        function editPeriod(period) {
            period.isEdit = true;
            period.original = angular.extend({}, period);
        }

        function cancelEditPeriod(period) {
            period.isEdit = false;
            period.begin = period.original.begin;
            period.end = period.original.end;
            period.name = period.original.name;
            delete period.original;
        }

        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();