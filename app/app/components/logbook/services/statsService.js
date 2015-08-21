(function () {
    'use strict';

    angular.module('bloglu.logbook')
            .factory('statsService', statsService);

    statsService.$inject = ['$filter', 'ResourceName'];

    function statsService($filter, ResourceName) {
        var statsService = {
            getStatsFromBloodGlucoseReadingList: getStatsFromBloodGlucoseReadingList
        };
        return statsService;
        
        function getBloodGlucoseRange(bloodGlucoseReading, ranges) {            
            var convertedReading = bloodGlucoseReading.reading * bloodGlucoseReading.unit.coefficient;
            var returnValue = '';
            angular.forEach(ranges, function (range) {
                if (convertedReading >= range.lowerLimit * range.unit.coefficient && convertedReading < range.upperLimit * range.unit.coefficient) {                      
                    returnValue = getDisplayRange(range);
                    return;
                }
            });
            return returnValue;
        }
        
        function getDisplayRange(range){
            return range.lowerLimit + ' ' + range.unit.name + ' - ' + range.upperLimit + ' ' + range.unit.name;
        }
        
        function getNumberByRange(ranges){
            var numberByRange = [];
            angular.forEach(ranges, function(range){
                numberByRange.push({
                    name: getDisplayRange(range),
                    number: 0
                });
            });
            return numberByRange;
        }
        
        function incrementNumberByRange(numbersByRange, rangeName){
            angular.forEach(numbersByRange, function(numberByRange){
                if(numberByRange.name === rangeName){
                    numberByRange.number++;
                }
            });
        }
        
        function getStatsFromBloodGlucoseReadingList(bloodGlucoseReadings, period, ranges) {            
            var stats = {};
            angular.forEach(bloodGlucoseReadings, function (bloodGlucoseReading) {
                if (angular.isDefined(bloodGlucoseReading.reading)) {
                    if (!stats[bloodGlucoseReading.code]) {
                        stats[bloodGlucoseReading.code] = {
                            maximum: null,
                            maximumIds: [],
                            minimum: null,
                            minimumIds: [],
                            number: 0,
                            numberByRange: getNumberByRange(ranges),
                            total: 0,
                            beginDate: period.begin,
                            endDate: period.end
                        };
                    }
                    //compute maximim
                    var reading = bloodGlucoseReading.reading * bloodGlucoseReading.unit.coefficient;
                    if (stats[bloodGlucoseReading.code].maximum === null || reading >= stats[bloodGlucoseReading.code].maximum) {
                        if (reading > stats[bloodGlucoseReading.code].maximum) {
                            stats[bloodGlucoseReading.code].maximum = reading;
                            stats[bloodGlucoseReading.code].maximumIds = [];
                            stats[bloodGlucoseReading.code].maximumIds.push(bloodGlucoseReading.objectId);
                        } else {
                            stats[bloodGlucoseReading.code].maximumIds.push(bloodGlucoseReading.objectId);
                        }
                    }
                    //compute minimum
                    if (stats[bloodGlucoseReading.code].minimum === null || reading < stats[bloodGlucoseReading.code].minimum) {
                        if (reading < stats[bloodGlucoseReading.code].minimum) {
                            stats[bloodGlucoseReading.code].minimum = reading;
                            stats[bloodGlucoseReading.code].minimumIds = [];
                            stats[bloodGlucoseReading.code].minimumIds.push(bloodGlucoseReading.objectId);
                        } else {
                            stats[bloodGlucoseReading.code].minimum = reading;
                        }
                    }
                    //compute number by range
                    var readingRange = getBloodGlucoseRange(bloodGlucoseReading,ranges);
                    if(readingRange){
                        incrementNumberByRange(stats[bloodGlucoseReading.code].numberByRange, readingRange);
                    }
                    stats[bloodGlucoseReading.code].number++;
                    stats[bloodGlucoseReading.code].total += reading;
                }
            });
            
            angular.forEach(stats, function (value, key) {
                value.title = ResourceName[parseInt(key)];
                value.code = parseInt(key);
                value.average = $filter('number')(value.total / value.number, 0);
            });
            return stats;
        }


        




    }
})();