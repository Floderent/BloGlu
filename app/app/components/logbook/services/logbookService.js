(function () {

    'use strict';

    angular.module('bloglu.logbook')
            .factory('logBookService', logBookService);

    logBookService.$inject = ['$q', '$filter', '$translate', 'UserService', 'dateUtil', 'statsService', 'dataService', 'ModelUtil', 'ResourceName'];


    function logBookService($q, $filter, $translate, UserService, dateUtil, statsService, dataService, ModelUtil, ResourceName) {
        var logBookService = {
            getTimeIntervalTitle: getTimeIntervalTitle,
            getEventTypes: getEventTypes,
            getDisplayParam: getDisplayParam,
            getTimeInterval: getTimeInterval,
            getTableData: getTableData,
            getAggregtedData: getAggregtedData,
            getWeekData: getWeekData,
            getDayData: getDayData,
            getMiddleTime: getMiddleTime
        };
        return logBookService;

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
                    name: $filter('date')(baseDate, 'EEEE d'),
                    begin: new Date(baseDate),
                    end: new Date(periodEndDate)
                };
                analysisPeriods.push(analysisPeriod);
                baseDate.setDate(baseDate.getDate() + 1);
            }            
            return $q.when(analysisPeriods);
        }



        function getYearAnalysisPeriod(timeInterval) {
            var analysisPeriods = [];            
            var baseDate = new Date(timeInterval.begin.getFullYear(), 0, 1);
            var endDate = new Date(timeInterval.end.getFullYear(), 11, 31);
            for (var year = baseDate.getFullYear(); year <= endDate.getFullYear(); year++) {
                for (var indexOfMonth = 0; indexOfMonth < 12; indexOfMonth++) {
                    var analysisPeriod = dateUtil.getDateMonthBeginAndEndDate(baseDate);
                    analysisPeriod.name = $filter('date')(baseDate, 'MMMM');
                    analysisPeriods.push(analysisPeriod);
                    baseDate.setMonth(baseDate.getMonth() + 1);
                }
                baseDate.setFullYear(baseDate.getFullYear() + 1);
            }
            return $q.when(analysisPeriods);
        }

        function getMonthAnalysisPeriod(timeInterval) {
            var analysisPeriods = [];            
            var baseDate = new Date(timeInterval.begin.getTime());
            var month = baseDate.getMonth();
            return UserService.getFirstDayOfWeek().then(function (firstDayOfWeek) {
                while (baseDate.getMonth() <= timeInterval.end.getMonth() && baseDate.getFullYear() === timeInterval.end.getFullYear()) {
                    var index = 0;
                    while (baseDate.getMonth() === month) {
                        var analysisPeriod = dateUtil.getDateWeekBeginAndEndDate(baseDate, firstDayOfWeek);
                        analysisPeriod.name = $translate.instant('logBook.week') + " " + (index + 1);
                        analysisPeriods.push(analysisPeriod);
                        baseDate.setDate(baseDate.getDate() + 7);
                        index++;
                    }
                    month = baseDate.getMonth();
                }
                return analysisPeriods;                
            });            
        }



        function getWeekAnalysisPeriod() {
            return dataService.queryLocal('Period').then(function (analysisPeriods) {
                var result = [];
                if (analysisPeriods && Array.isArray(analysisPeriods) && analysisPeriods.length > 0) {
                    result = analysisPeriods;
                    result.sort(function (a, b) {
                        return (a.begin.getHours() * 60 + a.begin.getMinutes()) - (b.begin.getHours() * 60 + b.begin.getMinutes());
                    });
                } else {
                    //get default values
                }
                return result;
            });
        }

        function getMonthWeekNumber(baseDate) {
            var month = baseDate.getMonth()
                    , year = baseDate.getFullYear()
                    , firstWeekday = new Date(year, month, 1).getDay()
                    , lastDateOfMonth = new Date(year, month + 1, 0).getDate()
                    , offsetDate = baseDate.getDate() + firstWeekday - 1
                    , index = 1 // start index at 0 or 1, your choice
                    , weeksInMonth = index + Math.ceil((lastDateOfMonth + firstWeekday - 7) / 7)
                    , week = index + Math.floor(offsetDate / 7)
                    ;
            if (baseDate || week < 2 + index) {
                return week;
            }
            return week === weeksInMonth ? index + 5 : week;
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
            periods.sort(function (date1, date2) {
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

        function getTimeIntervalTitle(timeInterval) {
            var title = "";
            if (timeInterval) {
                switch (timeInterval.name) {
                    case 'day':
                        title = $filter('date')(timeInterval.begin, 'EEEE d MMMM yyyy');
                        break;
                    case 'week':
                        title = $filter('date')(timeInterval.begin, 'MMMM yyyy') + " " + $translate.instant('logBook.week') + " " + getMonthWeekNumber(timeInterval.begin);
                        break;
                    case 'month':
                        title = $filter('date')(timeInterval.begin, 'MMMM yyyy');
                        break;
                    case 'year':
                        title = $filter('date')(timeInterval.begin, 'yyyy');
                        break;
                    default:
                        break;

                }
            }
            return title;
        }

        function getEventTypes(display) {
            var eventTypes = {};
            angular.forEach(display, function (value) {
                eventTypes[value] = ResourceName[value];
            });
            return eventTypes;
        }

        function getDisplayParam(array) {
            var result = '';
            angular.forEach(array, function (value, key) {
                result += value;
                if (key !== array.length - 1) {
                    result += ',';
                }
            });
            return result;
        }

        function getTimeInterval(intervalName, date) {            
            var timeInterval = null;
            return UserService.getFirstDayOfWeek().then(function (firstDayOfWeek) {
                switch (intervalName) {
                    case 'day':
                        timeInterval = dateUtil.getDateDayBeginAndEndDate(date);
                        break;
                    case 'week':
                        timeInterval = dateUtil.getDateWeekBeginAndEndDate(date, firstDayOfWeek);
                        break;
                    case 'month':
                        timeInterval = dateUtil.getDateMonthBeginAndEndDate(date);
                        break;
                    case 'year':
                        timeInterval = dateUtil.getDateYearBeginAndEndDate(date);
                        break;
                    default:
                        timeInterval = dateUtil.getDateWeekBeginAndEndDate(date, firstDayOfWeek);
                        break;
                }
                return timeInterval;
            });            
        }



        function getTableData(timeInterval, params) {
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
        }


        function getAggregtedData(timeInterval, params) {
            return $q.all([
                getBloodGlucoseReadingsBetweenDates(timeInterval.begin, timeInterval.end, params),
                getAnalysisPeriods(timeInterval)
            ]).then(function (result) {
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
                var readingsLength = bloodGlucoseReadings.length;
                for (var index = 0; index < readingsLength; index++) {
                    var bloodGlucoseReading = bloodGlucoseReadings[index];
                    var indexOfRow = 1;
                    var indexOfColumn = getBloodGlucoseReadingColumnByDate(timeInterval, analysisPeriods, bloodGlucoseReading.dateTime);
                    if (Array.isArray(dataArray[indexOfRow][indexOfColumn])) {
                        dataArray[indexOfRow][indexOfColumn].push(bloodGlucoseReading);
                    }
                }
                //aggregate
                var dataArrayLength = dataArray.length;
                for (var indexOfRow = 1; indexOfRow < dataArrayLength; indexOfRow++) {
                    for (var indexOfColumn = 0; indexOfColumn < dataArray[0].length; indexOfColumn++) {
                        if (dataArray[indexOfRow][indexOfColumn].length > 0) {
                            dataArray[indexOfRow][indexOfColumn] = [statsService.getStatsFromBloodGlucoseReadingList(dataArray[indexOfRow][indexOfColumn], analysisPeriods[indexOfColumn])];
                        }
                    }
                }
                return dataArray;
            });

        }


        function getWeekData(timeInterval, params) {
            return $q.all([
                getBloodGlucoseReadingsBetweenDates(timeInterval.begin, timeInterval.end, params),
                getAnalysisPeriods(timeInterval)
            ]).then(function (result) {
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
                var readingsLength = bloodGlucoseReadings.length;
                for (var index = 0; index < readingsLength; index++) {
                    var bloodGlucodeReading = bloodGlucoseReadings[index];
                    var indexOfRow = getBloodGlucoseReadingRowByDate(days, bloodGlucodeReading.dateTime) + 1;
                    //var indexOfRow = dateUtil.convertToNormalFormat(bloodGlucodeReading.dateTime).getDay() + 1;
                    var indexOfColumn = getBloodGlucoseReadingColumnByDate(timeInterval, analysisPeriods, bloodGlucodeReading.dateTime) + 1;
                    if (Array.isArray(dataArray[indexOfRow][indexOfColumn])) {
                        dataArray[indexOfRow][indexOfColumn].push(bloodGlucodeReading);
                    }
                }
                return dataArray;
            });
        }

        function getDayData(timeInterval, params) {
            return $q.all([
                getBloodGlucoseReadingsBetweenDates(timeInterval.begin, timeInterval.end, params),
                getAnalysisPeriods(timeInterval)
            ]).then(function (result) {
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
                angular.forEach(bloodGlucoseReadings, function (bloodGlucoseReading) {
                    var indexOfColumn = getBloodGlucoseReadingColumnByDate(timeInterval, analysisPeriods, bloodGlucoseReading.dateTime);
                    if (Array.isArray(dataArray[indexOfRow][indexOfColumn])) {
                        dataArray[indexOfRow][indexOfColumn].push(bloodGlucoseReading);
                    }
                });
                return dataArray;
            });
        }

        function getMiddleTime(period) {
            var middleTime = null;
            if (period && period.begin && period.end) {
                middleTime = new Date((getHourAndMinutesMilliseconds(period.begin) + getHourAndMinutesMilliseconds(period.end)) / 2);
            }
            return middleTime;
        }

        function getHourAndMinutesMilliseconds(jsDate) {
            var _MS_PER_HOUR = 1000 * 60 * 60;
            var _MS_PER_MINUTE = 1000 * 60;
            return jsDate.getHours() * _MS_PER_HOUR + jsDate.getMinutes() * _MS_PER_MINUTE;
        }
        
    }
})();