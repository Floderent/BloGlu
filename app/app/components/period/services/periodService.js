(function () {

    'use strict';

    angular.module('bloglu.period')
            .factory('periodService', periodService);

    periodService.$inject = ['$translate', 'genericDaoService', 'dateUtil'];

    function periodService($translate, genericDaoService, dateUtil) {

        var resourceName = 'Period';
        var periodService = {
            getPeriods: getPeriods,
            savePeriod: savePeriod,
            deletePeriod: deletePeriod,
            processPeriods: processPeriods,
            arePeriodsOnMoreThanOneDay: arePeriodsOnMoreThanOneDay,
            getNewPeriod: getNewPeriod,
            checkPeriods: checkPeriods
        };
        return periodService;

        function getPeriods() {
            return genericDaoService.getAll(resourceName);
        }

        function savePeriod(period, isEdit) {
            var objectToSave = {
                objectId: period.objectId,
                name: period.name,
                begin: period.begin,
                end: period.end
            };
            return genericDaoService.save(resourceName, objectToSave, isEdit);
        }

        function deletePeriod(period) {
            return genericDaoService.remove(resourceName, period);
        }

        function processPeriods(periodArray) {
            var newPeriod = null;
            if (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) === 0) {
                newPeriod = getNewPeriod(periodArray);
            }
            return newPeriod;
        }

        function arePeriodsOnMoreThanOneDay(periodArray) {
            return (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) >= 1);
        }

        function getNewPeriod(periodArray) {
            var maxEndDate = dateUtil.getPeriodMaxEndDate(periodArray);
            if (maxEndDate === null) {
                maxEndDate = new Date();
                maxEndDate.setHours(0);
                maxEndDate.setMinutes(0);
                maxEndDate.setSeconds(0);
                maxEndDate.setMilliseconds(0);
            }
            var endDate = new Date(maxEndDate.getTime());
            endDate.setDate(maxEndDate.getDate() + 1);
            endDate.setHours(0);
            endDate.setMinutes(0);
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);
            var newPeriod = {
                name: '',
                begin: maxEndDate,
                end: endDate
            };
            return newPeriod;
        }


        function checkPeriods(periods, newPeriod) {
            var errorMessages = [];
            var periodArray = periods.slice();
            if (newPeriod && newPeriod.begin && newPeriod.end) {
                periodArray.push(newPeriod);
                if (newPeriod.end.getHours() !== 0 && newPeriod.end.getMinutes() !== 0) {
                    if (newPeriod.begin > newPeriod.end) {
                        errorMessages.push($translate.instant("period.errorDate"));
                    }
                }
            }
            if (dateUtil.arePeriodsIntersecting(periodArray)) {
                errorMessages.push($translate.instant("period.errorIntersection"));
            }
            return errorMessages;
        }

        
    }
})();