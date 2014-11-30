'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('chartService', ['$q', 'overViewService', 'dataService', function ($q, overViewService, dataService) {
        var chartService = {};
        chartService.getGlucoseReadingData = function (readingGlucoseList) {
            var dataSerie = [];
            if (readingGlucoseList && Array.isArray(readingGlucoseList)) {
                angular.forEach(readingGlucoseList, function (readingGlucose) {
                    var row = [];
                    row[0] = readingGlucose.dateTime.getTime();
                    row[1] = readingGlucose.reading * readingGlucose.unit.coefficient;
                    dataSerie.push(row);
                });
            }
            return dataSerie;
        };

        chartService.getChartDataSeriesFromAggregatedData = function (aggregatedData) {
            var resultObject = {
                series: [],
                axisLabels: []
            };

            var averageSerie = {name: 'Average', data: []};
            var maxSerie = {name: 'Maximum', data: []};
            var minimumSerie = {name: 'Minimum', data: []};
            for (var lineIndex = 1; lineIndex < aggregatedData.length; lineIndex++) {
                for (var columnIndex = 0; columnIndex < aggregatedData[0].length; columnIndex++) {
                    var numericDataObject = {};
                    var textData = aggregatedData[0][columnIndex].name;
                    var average = null;
                    var maximum = null;
                    var minimum = null;

                    if (aggregatedData[1][columnIndex] && aggregatedData[1][columnIndex].length > 0) {
                        numericDataObject = aggregatedData[1][columnIndex][0];
                        average = parseInt(numericDataObject.average);
                        maximum = parseInt(numericDataObject.maximum);
                        minimum = parseInt(numericDataObject.minimum);

                        averageSerie.data.push([textData, average]);
                        maxSerie.data.push([textData, maximum]);
                        minimumSerie.data.push([textData, minimum]);

                        resultObject.axisLabels.push(textData);
                    }

                }
            }
            resultObject.series.push(averageSerie);
            resultObject.series.push(maxSerie);
            resultObject.series.push(minimumSerie);
            return resultObject;
        };



        chartService.getChartAggregatedDataSeries = function (beginDate, endDate, groupBy, includeTarget) {
            var params = {};
            var timeInterval = {
                name: groupBy,
                begin: beginDate,
                end: endDate
            };
            var promises = [overViewService.getAggregtedData(timeInterval, params)];
            if (includeTarget) {
                promises.push(dataService.queryLocal('Target'));
            }
            return $q.all(promises).then(function (results) {
                return chartService.getChartDataSeriesFromAggregatedData(results[0]);
            });
        };

        return chartService;
    }]);



servicesModule.factory('statsService', ['$filter', 'ResourceName', function ($filter, ResourceName) {
        var statsService = {};

        statsService.getStatsFromBloodGlucoseReadingList = function (bloodGlucoseReadings) {
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
                            total: 0
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
    }]);