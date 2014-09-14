'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('logBookService', ['$q', '$filter','$translate', 'UserService', 'dateUtil', 'statsService', 'dataService', 'ModelUtil','ResourceName', function($q, $filter,$translate, UserService, dateUtil, statsService, dataService, ModelUtil, ResourceName) {
        var logBookService = {};
        
        function getBloodGlucoseReadingsBetweenDates(beginDate, endDate, params) {            
            var where = ModelUtil.addClauseToFilter({dateTime: {$gt: beginDate, $lt: endDate}}, params.where);
            delete params.where;
            var queryParams = angular.extend({where: where}, params);            
            return dataService.queryLocal('Event', queryParams);
        }

        function getAnalysisPeriods(timeInterval) {
            var analysisPeriodPromise = null;
            switch (timeInterval.name) {
                case 'week':
                    analysisPeriodPromise = getWeekAnalysisPeriod(timeInterval);
                    break;
                case 'month':
                    analysisPeriodPromise = getMonthAnalysisPeriod(timeInterval);
                    break;
                case 'year':
                    analysisPeriodPromise = getYearAnalysisPeriod(timeInterval);
                    break;
                case 'day':
                    analysisPeriodPromise = getDayAnalysisPeriod(timeInterval);
                    break;
                default:
                    analysisPeriodPromise = getWeekAnalysisPeriod(timeInterval);
                    break;
            }
            return analysisPeriodPromise;
        }

        function getDayAnalysisPeriod(timeInterval) {
            var analysisPeriods = [];
            var deferred = $q.defer();
            var baseDate = new Date(timeInterval.begin);
            baseDate.setHours(0);
            baseDate.setMinutes(0);
            baseDate.setSeconds(0);
            baseDate.setMilliseconds(0);
            var endDate = new Date(timeInterval.end);
            endDate.setHours(23);
            endDate.setMinutes(59);
            endDate.setSeconds(59);
            endDate.setMilliseconds(999);
            while (baseDate < endDate) {
                var periodEndDate = new Date(baseDate);
                periodEndDate.setHours(23);
                periodEndDate.setMinutes(59);
                periodEndDate.setSeconds(59);
                periodEndDate.setMilliseconds(999);
                var analysisPeriod = {
                    name: $filter('date')(baseDate, 'EEEE d MMMM yyyy'),
                    begin: new Date(baseDate),
                    end: new Date(periodEndDate)
                };
                analysisPeriods.push(analysisPeriod);
                baseDate.setDate(baseDate.getDate() + 1);
            }
            deferred.resolve(analysisPeriods);
            return deferred.promise;
        }



        function getYearAnalysisPeriod(timeInterval) {
            var analysisPeriods = [];
            var deferred = $q.defer();
            var baseDate = new Date(timeInterval.begin.getFullYear(), 0, 1);
            var endDate = new Date(timeInterval.end.getFullYear(), 11, 31);
            for (var year = baseDate.getFullYear(); year <= endDate.getFullYear(); year++) {
                for (var indexOfMonth = 0; indexOfMonth < 12; indexOfMonth++) {
                    var analysisPeriod = dateUtil.getDateMonthBeginAndEndDate(baseDate);
                    analysisPeriod.name = $filter('date')(baseDate, 'MMMM yyyy');
                    analysisPeriods.push(analysisPeriod);
                    baseDate.setMonth(baseDate.getMonth() + 1);
                }
                baseDate.setFullYear(baseDate.getFullYear() + 1);
            }
            deferred.resolve(analysisPeriods);
            return deferred.promise;
        }

        function getMonthAnalysisPeriod(timeInterval) {
            var analysisPeriods = [];
            var deferred = $q.defer();
            var baseDate = new Date(timeInterval.begin.getTime());
            var month = baseDate.getMonth();
            var firstDayOfWeek = UserService.getFirstDayOfWeek();
            while (baseDate.getMonth() <= timeInterval.end.getMonth() && baseDate.getFullYear() === timeInterval.end.getFullYear()) {
                var index = 0;
                while (baseDate.getMonth() === month) {
                    var analysisPeriod = dateUtil.getDateWeekBeginAndEndDate(baseDate, firstDayOfWeek);                    
                    analysisPeriod.name = $filter('date')(baseDate, 'MMMM yyyy') + " "+ $translate.instant('logBook.week')+ " " + (index + 1);
                    analysisPeriods.push(analysisPeriod);
                    baseDate.setDate(baseDate.getDate() + 7);
                    index++;
                }
                month = baseDate.getMonth();
            }
            deferred.resolve(analysisPeriods);
            return deferred.promise;
        }



        function getWeekAnalysisPeriod() {
            return dataService.queryLocal('Period').then(function(analysisPeriods) {
                var result = [];
                if (analysisPeriods && Array.isArray(analysisPeriods) && analysisPeriods.length > 0) {
                    result = analysisPeriods;
                    result.sort(function(a, b) {
                        return (a.begin.getHours() * 60 + a.begin.getMinutes()) - (b.begin.getHours() * 60 + b.begin.getMinutes());
                    });
                } else {
                    //get default values
                }
                return result;
            });
        }



        function isDateInPeriod(timeIntervalName, date, period) {
            var isPeriodInDate = false;
            if (timeIntervalName === 'week') {
                var dateHours = date.getHours();
                var dateMinutes = date.getMinutes();

                var beginDateHours = period.begin.getHours();
                var beginDateMinutes = period.begin.getMinutes();

                var endDateHours = period.end.getHours();
                if (endDateHours === 0) {
                    endDateHours = 23;
                }
                var endDateMinutes = period.end.getMinutes();
                if (endDateHours === 23 && endDateMinutes === 0) {
                    endDateMinutes = 59;
                }
                if (dateHours > beginDateHours && dateHours < endDateHours) {
                    isPeriodInDate = true;
                } else {
                    if (dateHours === beginDateHours && dateMinutes >= beginDateMinutes && dateHours < endDateHours) {
                        isPeriodInDate = true;
                    } else {
                        if (dateHours > beginDateHours && dateHours === endDateHours && dateMinutes <= endDateMinutes) {
                            isPeriodInDate = true;
                        } else {
                            isPeriodInDate = false;
                        }
                    }
                }
            } else {
                isPeriodInDate = date >= period.begin && date <= period.end;
            }
            return isPeriodInDate;
        }

        function sortPeriods(periods) {
            periods.sort(function(date1, date2) {
                if (date1 > date2)
                    return 1;
                if (date1 < date2)
                    return -1;
                return 0;
            });
        }

        function getBloodGlucoseReadingColumnByDate(timeInterval, periods, bgrDate) {
            var index = -1;
            for (var indexOfPeriod = 0; indexOfPeriod < periods.length; indexOfPeriod++) {
                var period = periods[indexOfPeriod];
                if (isDateInPeriod(timeInterval.name, bgrDate, period)) {
                    index = indexOfPeriod;
                    break;
                }
            }
            return index;
        }

        function getBloodGlucoseReadingRowByDate(days, date) {
            return days.indexOf(date.getDate());
        }
              

        logBookService.getEventTypes = function(display) {
            var eventTypes = {};
            angular.forEach(display, function(value, key) {
                eventTypes[value] = ResourceName[value];
            });
            return eventTypes;
        };
        
        logBookService.getDisplayParam = function(array) {
            var result = '';
            angular.forEach(array, function(value, key) {
                result += value;
                if (key !== array.length - 1) {
                    result += ',';
                }
            });
            return result;
        };
        
        

        logBookService.getTimeInterval = function(intervalName, date) {
            var timeInterval = null;
            switch (intervalName) {
                case 'day':
                    timeInterval = dateUtil.getDateDayBeginAndEndDate(date);
                    break;
                case 'week':
                    timeInterval = dateUtil.getDateWeekBeginAndEndDate(date, UserService.getFirstDayOfWeek());
                    break;
                case 'month':
                    timeInterval = dateUtil.getDateMonthBeginAndEndDate(date);
                    break;
                case 'year':
                    timeInterval = dateUtil.getDateYearBeginAndEndDate(date);
                    break;
                default:
                    timeInterval = dateUtil.getDateWeekBeginAndEndDate(date, UserService.getFirstDayOfWeek());
                    break;
            }
            return timeInterval;
        };



        logBookService.getTableData = function(timeInterval, params) {
            var dataPromise = null;
            var dataParams = angular.extend({}, params);
            switch (timeInterval.name) {
                case 'day':
                    dataPromise = logBookService.getDayData(timeInterval, dataParams);
                    break;
                case 'week':
                    dataPromise = logBookService.getWeekData(timeInterval, dataParams);
                    break;
                case 'month':
                case 'year':
                    dataPromise = logBookService.getAggregtedData(timeInterval, dataParams);
                    break;
                default:
                    dataPromise = logBookService.getWeekData(timeInterval, dataParams);
                    break;
            }
            return dataPromise;
        };


        logBookService.getAggregtedData = function(timeInterval, params) {
            return $q.all([
                getBloodGlucoseReadingsBetweenDates(timeInterval.begin, timeInterval.end, params),
                getAnalysisPeriods(timeInterval)
            ]).then(function(result) {
                var bloodGlucoseReadings = result[0];
                var analysisPeriods = result[1];
                var dataArray = [];
                dataArray[0] = [];
                var numberOfRow = 1;
                //init column headers
                for (var indexOfWeek = 0; indexOfWeek < analysisPeriods.length; indexOfWeek++) {
                    dataArray[0][indexOfWeek] = analysisPeriods[indexOfWeek];
                }
                //init row header                
                dataArray[1] = [];
                dataArray[1][0] = [];

                // init array
                for (var lineIndex = 0; lineIndex < numberOfRow + 1; lineIndex++) {
                    for (var indexOfColumn = 0; indexOfColumn < analysisPeriods.length; indexOfColumn++) {
                        if (!dataArray[lineIndex][indexOfColumn]) {
                            dataArray[lineIndex][indexOfColumn] = [];
                        }
                    }
                }
                //put blood glucose readings in right row and column
                angular.forEach(bloodGlucoseReadings, function(bloodGlucoseReading) {
                    var indexOfRow = 1;
                    var indexOfColumn = getBloodGlucoseReadingColumnByDate(timeInterval, analysisPeriods, bloodGlucoseReading.dateTime);
                    if (Array.isArray(dataArray[indexOfRow][indexOfColumn])) {
                        dataArray[indexOfRow][indexOfColumn].push(bloodGlucoseReading);
                    }
                });

                //aggregate
                for (var indexOfRow = 1; indexOfRow < dataArray.length; indexOfRow++) {
                    for (var indexOfColumn = 0; indexOfColumn < dataArray[0].length; indexOfColumn++) {
                        if (dataArray[indexOfRow][indexOfColumn].length > 0) {
                            dataArray[indexOfRow][indexOfColumn] = [statsService.getStatsFromBloodGlucoseReadingList(dataArray[indexOfRow][indexOfColumn])];
                        }
                    }
                }
                return dataArray;
            });

        };


        logBookService.getWeekData = function(timeInterval, params) {
            return $q.all([
                getBloodGlucoseReadingsBetweenDates(timeInterval.begin, timeInterval.end, params),
                getAnalysisPeriods(timeInterval)
            ]).then(function(result) {
                var bloodGlucoseReadings = result[0];
                var analysisPeriods = result[1];
                sortPeriods(analysisPeriods);
                var dataArray = [];
                //init periods, column headers
                dataArray[0] = [];
                for (var indexOfPeriod = 1; indexOfPeriod < analysisPeriods.length + 1; indexOfPeriod++) {
                    dataArray[0][indexOfPeriod] = analysisPeriods[indexOfPeriod - 1];
                }
                var days = [];
                //init days, row headers                
                for (var indexOfDay = 1; indexOfDay < 8; indexOfDay++) {
                    if (!dataArray[indexOfDay]) {
                        dataArray[indexOfDay] = [];
                    }
                    var dayDate = new Date(timeInterval.begin.getTime());
                    dayDate.setDate(dayDate.getDate() + (indexOfDay - 1));
                    var dayOfMonth = dayDate.getDate();
                    dayDate.setDate(dayOfMonth);
                    days.push(dayOfMonth);
                    dataArray[indexOfDay][0] = {
                        date: dayDate
                    };
                }
                // init array
                for (var lineIndex = 0; lineIndex < 8; lineIndex++) {
                    for (var indexOfColumn = 0; indexOfColumn < analysisPeriods.length + 1; indexOfColumn++) {
                        if (!dataArray[lineIndex][indexOfColumn]) {
                            dataArray[lineIndex][indexOfColumn] = [];
                        }
                    }
                }
                //put blood glucose readings in right row and column
                angular.forEach(bloodGlucoseReadings, function(bloodGlucodeReading) {
                    var indexOfRow = getBloodGlucoseReadingRowByDate(days, bloodGlucodeReading.dateTime) + 1;
                    //var indexOfRow = dateUtil.convertToNormalFormat(bloodGlucodeReading.dateTime).getDay() + 1;
                    var indexOfColumn = getBloodGlucoseReadingColumnByDate(timeInterval, analysisPeriods, bloodGlucodeReading.dateTime) + 1;
                    if (Array.isArray(dataArray[indexOfRow][indexOfColumn])) {
                        dataArray[indexOfRow][indexOfColumn].push(bloodGlucodeReading);
                    }
                });                
                return dataArray;
            });
        };

        logBookService.getDayData = function(timeInterval, params) {
            return $q.all([
                getBloodGlucoseReadingsBetweenDates(timeInterval.begin, timeInterval.end, params),
                getAnalysisPeriods(timeInterval)
            ]).then(function(result) {
                var bloodGlucoseReadings = result[0];
                var analysisPeriods = result[1];
                var dataArray = [];
                dataArray[0] = [];
                //init column headers
                for (var indexOfWeek = 0; indexOfWeek < analysisPeriods.length; indexOfWeek++) {
                    dataArray[0][indexOfWeek] = analysisPeriods[indexOfWeek];
                }
                //init row header                
                dataArray[1] = [];
                dataArray[1][0] = [];

                var indexOfRow = 1;
                //put blood glucose readings in right row and column
                angular.forEach(bloodGlucoseReadings, function(bloodGlucoseReading) {
                    var indexOfColumn = getBloodGlucoseReadingColumnByDate(timeInterval, analysisPeriods, bloodGlucoseReading.dateTime);
                    if (Array.isArray(dataArray[indexOfRow][indexOfColumn])) {
                        dataArray[indexOfRow][indexOfColumn].push(bloodGlucoseReading);
                    }
                });
                return dataArray;
            });
        };
        
        logBookService.getMiddleTime =  function(period){
            var middleTime = null;            
            if(period && period.begin && period.end){
                middleTime = new Date((getHourAndMinutesMilliseconds(period.begin) + getHourAndMinutesMilliseconds(period.end))/2);
            }
            return middleTime;
        };
        
        function getHourAndMinutesMilliseconds(jsDate){
            var _MS_PER_HOUR = 1000 * 60 * 60;
            var _MS_PER_MINUTE = 1000 * 60;            
            return jsDate.getHours() * _MS_PER_HOUR + jsDate.getMinutes() * _MS_PER_MINUTE;
        }
        
        

        return logBookService;
    }]);
