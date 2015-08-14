(function () {
    'use strict';

    angular.module('bloglu.utils')
            .factory('dateUtil', dateUtil);

    dateUtil.$inject = ['$filter'];

    function dateUtil($filter) {

        var dateUtil = {
            processDateTime: processDateTime,
            getPeriodMaxDate: getPeriodMaxDate,
            getPeriodMaxEndDate: getPeriodMaxEndDate,
            getPeriodMaxBeginDate: getPeriodMaxBeginDate,
            getNumberOfMillis: getNumberOfMillis,
            daysInMonth: daysInMonth,
            getAvailableDays: getAvailableDays,
            arePeriodsIntersecting: arePeriodsIntersecting,
            arePeriodIntersecting: arePeriodIntersecting,
            checkDuration: checkDuration,
            getDateHourAndMinuteToMillis: getDateHourAndMinuteToMillis,
            getMonthWeek: getMonthWeek,
            weekCount: weekCount,
            addDays: addDays,
            getDateWeekBeginAndEndDate: getDateWeekBeginAndEndDate,
            getDateMonthBeginAndEndDate: getDateMonthBeginAndEndDate,
            getDateDayBeginAndEndDate: getDateDayBeginAndEndDate,
            getDateYearBeginAndEndDate: getDateYearBeginAndEndDate,
            getCurrentWeekSundayAndMonday: getCurrentWeekSundayAndMonday,
            arePeriodsOnMoreThanOneDay: arePeriodsOnMoreThanOneDay,
            getAvailableYears: getAvailableYears,
            getAvailableMonths: getAvailableMonths,
            convertToNormalFormat: convertToNormalFormat,
            convertToParseFormat: convertToParseFormat
        };
        return dateUtil;


        function getGMTMillis(timeZonedDate) {
            var userOffset = timeZonedDate.getTimezoneOffset() * 60 * 1000;
            var centralOffset = 6 * 60 * 60 * 1000;
            var GMTDate = new Date(timeZonedDate.getTime() - userOffset + centralOffset);
            return GMTDate.getTime();
        }


        function dateDiff(a, b, coef) {
            // Discard the time and time-zone information.
            var utc1 = //Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
                    getGMTMillis(a);
            var utc2 = //Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
                    getGMTMillis(b);
            return Math.floor((utc2 - utc1) / coef);
        }       

        function dateDiffInHours(a, b) {
            var _MS_PER_HOUR = 1000 * 60 * 60;
            return dateDiff(a, b, _MS_PER_HOUR);
        }

        function processDate(dateStr) {
            var date = null;
            if (dateStr) {
                var splittedDate = dateStr.split("/");
                var day = parseInt(splittedDate[0]);
                var month = parseInt(splittedDate[1]);
                var year = parseInt(splittedDate[2]);
                if (splittedDate[2].length === 2) {
                    year = 2000 + parseInt(splittedDate[2]);
                }
                date = new Date();
                date.setFullYear(year);
                date.setMonth(month - 1);
                date.setDate(day);
            }
            return date;
        }

        function processTime(timeStr) {
            var date = null;
            if (timeStr) {
                var splittedDate = timeStr.split(":");
                var hours = parseInt(splittedDate[0]);
                var minutes = parseInt(splittedDate[1]);
                var seconds = parseInt(splittedDate[2]);
                date = new Date(0, 0, 0, hours, minutes, seconds);
            }
            return date;
        }

        function getPeriodDuration(period) {
            var duration = null;
            if (period && period.begin && period.end) {
                if (period.end.getHours() === 0) {
                    duration = dateUtil.getDateHourAndMinuteToMillis(period.end, true) - dateUtil.getDateHourAndMinuteToMillis(period.begin);
                } else {
                    duration = dateUtil.getDateHourAndMinuteToMillis(period.end) - dateUtil.getDateHourAndMinuteToMillis(period.begin);
                }
            }
            return duration;
        }

        function processDateTime(dateStr) {
            var date = null;
            if (dateStr) {
                var splittedDateTime = dateStr.split(' ');
                var datePart = splittedDateTime[0];
                var timePart = splittedDateTime[1];

                var d = processDate(datePart);
                var t = processTime(timePart);

                date = new Date();
                date.setFullYear(d.getFullYear());
                date.setMonth(d.getMonth());
                date.setDate(d.getDate());

                date.setHours(t.getHours());
                date.setMinutes(t.getMinutes());
                date.setSeconds(t.getSeconds());

                date.setMilliseconds(0);

            }
            return date;
        }

        function getPeriodMaxDate(periodArray, dateField) {
            var maxDate = null;
            if (Array.isArray(periodArray)) {
                angular.forEach(periodArray, function (period) {
                    if (maxDate === null || maxDate < period[dateField]) {
                        maxDate = period[dateField];
                    }
                });
            }
            return maxDate;
        }

        function getPeriodMaxEndDate(periodArray) {
            return dateUtil.getPeriodMaxDate(periodArray, 'end');
        }

        function getPeriodMaxBeginDate(periodArray) {
            return dateUtil.getPeriodMaxDate(periodArray, 'begin');
        }

        function getNumberOfMillis(timeString) {
            var splittedDateString = timeString.split(":");
            var hours = parseInt(splittedDateString[0], 10);
            var minutes = parseInt(splittedDateString[1], 10);
            return (hours * 60 + minutes) * 60 * 1000;
        }

        function daysInMonth(month, year) {
            return new Date(year, month, 0).getDate();
        }

        function getAvailableDays(month, year) {
            var numberOfDays = dateUtil.daysInMonth(month, year);
            var day = 1;
            var resultArray = [];
            while (day < numberOfDays) {
                resultArray.push(day);
                day++;
            }
            return resultArray;
        }

        function arePeriodsIntersecting(periodArray) {
            var arePeriodIntersecting = false;
            if (periodArray && Array.isArray(periodArray)) {
                for (var index = 0; index < periodArray.length; index++) {
                    var period = periodArray[index];
                    for (var j = 0; j < periodArray.length; j++) {
                        if (j !== index) {
                            var comparisonPeriod = periodArray[j];
                            if (dateUtil.arePeriodIntersecting(period, comparisonPeriod)) {
                                arePeriodIntersecting = true;
                                break;
                            }
                        }
                    }
                }
            }
            return arePeriodIntersecting;
        }

        function arePeriodIntersecting(period1, period2) {
            var period1BeginDate = dateUtil.getDateHourAndMinuteToMillis(period1.begin);
            var period1EndDate = dateUtil.getDateHourAndMinuteToMillis(period1.end);
            var period2BeginDate = dateUtil.getDateHourAndMinuteToMillis(period2.begin);
            var period2EndDate = dateUtil.getDateHourAndMinuteToMillis(period2.end);
            return period1BeginDate > period2BeginDate && period1BeginDate < period2EndDate ||
                    period1EndDate > period2BeginDate && period1EndDate < period2EndDate;
        }

        function checkDuration(period) {
            var valid = false;
            if (period && period.begin && period.end) {
                valid = dateDiffInHours(period.begin, period.end) <= 24;
            }
            return valid;
        }

        function getDateHourAndMinuteToMillis(date, use24) {
            var hourCoef = 60 * 60 * 1000;
            var minuteCoef = 60 * 1000;
            var hours = date.getHours();
            if (hours === 0 && use24) {
                hours = 24;
            }
            return hours * hourCoef + date.getMinutes() * minuteCoef;
        }

        function getMonthWeek(date) {
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
            return Math.ceil((date.getDate() + firstDay) / 7);
        }

        function weekCount(year, month_number) {
            var firstOfMonth = new Date(year, month_number - 1, 1);
            var lastOfMonth = new Date(year, month_number, 0);
            var used = firstOfMonth.getDay() + lastOfMonth.getDate();
            return Math.ceil(used / 7);
        }

        function addDays(date, days) {
            var result = new Date(date);
            result.setDate(date.getDate() + days);
            return result;
        }

        function getDateWeekBeginAndEndDate(date, indexOfFirstDay) {
            var beginDate = null;
            var endDate = null;

            indexOfFirstDay = parseInt(indexOfFirstDay);

            if (date.getDay() === indexOfFirstDay) {
                beginDate = new Date(date.getTime());
                endDate = new Date(date.getTime());
                endDate = dateUtil.addDays(beginDate, 6);
            } else {
                if (date.getDay() < indexOfFirstDay) {
                    var index = date.getDay();
                    while (index < indexOfFirstDay) {
                        index++;
                    }
                    beginDate = new Date(date.getTime());
                    endDate = new Date(date.getTime());
                    beginDate.setDate(date.getDate() - (7 - index));
                    endDate = dateUtil.addDays(beginDate, 6);
                } else {
                    var index = date.getDay();
                    var adjust = 0;
                    while (index > indexOfFirstDay) {
                        index--;
                        adjust++;
                    }
                    beginDate = new Date(date.getTime());
                    beginDate.setDate(date.getDate() - adjust);
                    endDate = new Date(beginDate.getTime());
                    endDate = dateUtil.addDays(beginDate, 6);
                }
            }
            beginDate.setHours(0);
            beginDate.setMinutes(0);
            beginDate.setSeconds(0);
            beginDate.setMilliseconds(0);

            endDate.setHours(23);
            endDate.setMinutes(59);
            endDate.setSeconds(59);
            endDate.setMilliseconds(999);

            return {
                name: 'week',
                begin: beginDate,
                end: endDate
            };
        }

        function getDateMonthBeginAndEndDate(date) {
            var beginDate = new Date(date.getFullYear(), date.getMonth());
            var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return {
                name: 'month',
                begin: beginDate,
                end: endDate
            };
        }

        function getDateDayBeginAndEndDate(date) {
            var beginDate = new Date(date);
            beginDate.setHours(0);
            beginDate.setMinutes(0);
            beginDate.setSeconds(0);
            beginDate.setMilliseconds(0);

            var endDate = new Date(date);
            endDate.setHours(23);
            endDate.setMinutes(59);
            endDate.setSeconds(59);
            endDate.setMilliseconds(999);

            return {
                name: 'day',
                begin: beginDate,
                end: endDate
            };
        }

        function getDateYearBeginAndEndDate(date) {
            var beginDate = new Date(date.getFullYear(), 0, 1);
            var endDate = new Date(date.getFullYear() + 1, 0, 0);
            return {
                name: 'year',
                begin: beginDate,
                end: endDate
            };
        }

        function getCurrentWeekSundayAndMonday() {
            var period = dateUtil.getDateWeekBeginAndEndDate(new Date(), 0);
            var sunday = period.begin;
            var monday = new Date(period.begin.getTime());
            monday.setDate(monday.getDate() + 1);
            return [{index: "0", date: $filter('date')(sunday, 'EEEE')}, {index: "1", date: $filter('date')(monday, 'EEEE')}];
        }

        function arePeriodsOnMoreThanOneDay(periods) {
            var total = 0;
            var result = 0;
            var max = 86400000;
            for (var index = 0; index < periods.length; index++) {
                var period = periods[index];
                var duration = getPeriodDuration(period);
                total += Math.abs(duration);
                if (total > max) {
                    break;
                }
            }
            if (total > max) {
                result = 2;
            } else {
                if (total === max) {
                    result = 1;
                } else {
                    result = 0;
                }
            }
            return result;
        }


        function getAvailableYears() {
            var resultArray = [];
            var yearNumber = 100;
            var startYear = 1970;
            var i = 0;
            while (i < yearNumber) {
                resultArray.push(startYear + i);
                i++;
            }
            return resultArray;
        }

        function getAvailableMonths() {
            var resultArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            return resultArray;
        }

        function convertToNormalFormat(parseDate) {
            var normalDate = null;
            if (parseDate && parseDate.iso) {
                var startTimeISOString = parseDate.iso;
                normalDate = new Date(startTimeISOString);
                //normalDate = new Date(normalDate.getTime() + (normalDate.getTimezoneOffset() * 60000));
            }
            return normalDate;
        }


        function convertToParseFormat(date) {
            var parseDate = null;
            if (date) {
                //{"__type":"Date", "iso":"2012-04-30T09:34:08.256Z"}
                parseDate = {};
                parseDate.__type = "Date";
                parseDate.iso = date.toISOString();
            }
            return parseDate;
        }

    }

})();
