(function () {
    'use strict';

    angular.module('bloglu.logbook')
            .factory('statsService', statsService);

    statsService.$inject = ['$filter', 'ResourceName'];

    function statsService($filter, ResourceName) {
        var statsService = {};

        statsService.getStatsFromBloodGlucoseReadingList = function (bloodGlucoseReadings, period) {
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
                            total: 0,
                            beginDate: period.begin,
                            endDate: period.end
                        };
                    }
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
                    if (stats[bloodGlucoseReading.code].minimum === null || reading < stats[bloodGlucoseReading.code].minimum) {
                        if (reading < stats[bloodGlucoseReading.code].minimum) {
                            stats[bloodGlucoseReading.code].minimum = reading;
                            stats[bloodGlucoseReading.code].minimumIds = [];
                            stats[bloodGlucoseReading.code].minimumIds.push(bloodGlucoseReading.objectId);
                        } else {
                            stats[bloodGlucoseReading.code].minimum = reading;
                        }
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
        };

        return statsService;
    }
})();