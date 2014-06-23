'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('periodService', ['genericDaoService', 'dateUtil', function(genericDaoService, dateUtil) {

        var resourceName = 'Period';
        var periodService = {};
        
        
        periodService.getPeriods = function(){
            return genericDaoService.getAll(resourceName);
        };
        
        periodService.savePeriod = function(period, isEdit) {
            var objectToSave = {
                objectId: period.objectId,
                name: period.name,
                begin: period.begin,
                end: period.end
            };
            return genericDaoService.save(resourceName, objectToSave, isEdit);
        };
        
        periodService.deletePeriod = function(period){
            return genericDaoService.delete(resourceName, period);
        };
        


        periodService.processPeriods = function(periodArray) {
            var newPeriod = null;
            if (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) === 0) {
                newPeriod = getNewPeriod(periodArray);
            }
            return newPeriod;
        };


        periodService.arePeriodsOnMoreThanOneDay = function(periodArray) {            
            return (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) >= 1);
        };

        periodService.getNewPeriod = function(periodArray) {
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
        };


        periodService.checkPeriods = function(periods, newPeriod) {
            var errorMessages = [];
            var periodArray = periods.slice();
            if (newPeriod && newPeriod.begin && newPeriod.end) {
                periodArray.push(newPeriod);
                if (newPeriod.end.getHours() !== 0 && newPeriod.end.getMinutes() !== 0) {
                    if (newPeriod.begin > newPeriod.end) {
                        errorMessages.push("Period begining must be inferior to period end.");
                    }
                }
            }
            if (dateUtil.arePeriodsIntersecting(periodArray)) {
                errorMessages.push("The period is intersecting with another.");
            }
            return errorMessages;
        };






        return periodService;
    }]);


