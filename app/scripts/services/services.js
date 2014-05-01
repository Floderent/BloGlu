'use strict';

var applicationId = 'U5hc606XgvqC5cNoBW9EUOYRPN28bGsiowBYLVbv';
var javascriptKey = 'B5ytGV1AZND3t2HvHFMzZNEtBTzydI9PB7J5TbRg';
var restApiKey = 'PPawPdkaltJhjHktfeHaQeBoVOYgphPn0ByIZl5v';

var parseBaseUrl = 'https://api.parse.com/1/';
var headers = {
    "Content-Type": 'application/json',
    "X-Parse-Application-Id": applicationId,
    "X-Parse-REST-API-Key": restApiKey
};
var servicesModule = angular.module('BloGlu.services', ['ngResource']);

servicesModule.factory("MyInterceptor", ["$q", "$location", "$injector", function($q, $location, $injector) {
        return {
            responseError: function(rejection) {
                if (rejection.status === 401) {
                    //UserService.logOut();
                    $location.path("/").search('returnTo', $location.path());
                }
                return $q.reject(rejection);
            }
        };
    }]);

servicesModule.factory('MessageService', ['$timeout', function($timeout) {
        var messageService = {};
        messageService.message = function(type, text, delay) {
            var message = {
                display: true,
                text: text,
                type: type
            };
            if (delay) {
                message.autoclose = function() {
                    var that = this;
                    that.promise = $timeout(function() {
                        that.display = false;
                        //
                    }, delay);
                }.bind(message);
                message.autoclose();
            }
            return message;
        };
        messageService.errorMessage = function(text, delay) {
            return messageService.message('error', text, delay);
        };
        messageService.successMessage = function(text, delay) {
            return messageService.message('success', text, delay);
        };
        messageService.cancel = function(message) {
            if (message.promise) {
                $timeout.cancel(message.promise);
            }
        };
        messageService.cancelAll = function(messages) {
            if (messages && Array.isArray(messages)) {
                messages.forEach(function(message) {
                    messageService.cancel(message);
                });
            }
        };
        return messageService;
    }]);



servicesModule.factory('Unit', ['$resource', function($resource) {
        var url = parseBaseUrl + 'classes/Unit/:Id';
        return $resource(url,
                {Id: '@Id'},
        {
            query: {
                method: 'GET',
                headers: headers,
                isArray: true,
                transformResponse: function(data) {
                    var jsonResponse = angular.fromJson(data);
                    if (jsonResponse && jsonResponse.results) {
                        jsonResponse = jsonResponse.results;
                    }
                    return jsonResponse;
                }
            }
        });
    }]);

servicesModule.factory('ReadingGlucoseBlood', ['$resource', 'UserService', 'dateUtil', function($resource, UserService, dateUtil) {
        var url = parseBaseUrl + "classes/ReadingGlucoseBlood/:Id";
        return $resource(url, {},
                {
                    query: {
                        method: 'GET',
                        headers: UserService.headers(),
                        isArray: true,
                        transformResponse: function(data) {
                            var jsonResponse = angular.fromJson(data);
                            if (jsonResponse && jsonResponse.results) {
                                jsonResponse = jsonResponse.results;
                                jsonResponse = jsonResponse.map(function(element) {
                                    if (element.dateTime) {
                                        element.dateTime = dateUtil.convertToNormalFormat(element.dateTime);
                                    }
                                    return element;
                                });
                            }
                            return jsonResponse;
                        }
                    },
                    count: {
                        method: 'GET',
                        headers: UserService.headers()
                    },
                    save: {
                        method: 'POST',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                                if (data.dateTime) {
                                    data.dateTime = dateUtil.convertToParseFormat(data.dateTime);
                                }
                                if (data.unit && data.unit.objectId) {
                                    data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                                }
                            }
                            return angular.toJson(data);
                        }
                    },
                    get: {
                        method: 'GET',
                        headers: UserService.headers(),
                        transformResponse: function(data) {
                            var jsonResponse = angular.fromJson(data);
                            if (jsonResponse) {
                                if (jsonResponse.dateTime) {
                                    jsonResponse.dateTime = dateUtil.convertToNormalFormat(jsonResponse.dateTime);
                                }
                            }
                            return jsonResponse;
                        }
                    },
                    update: {
                        method: 'PUT',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                                if (data.dateTime) {
                                    data.dateTime = dateUtil.convertToParseFormat(data.dateTime);
                                }
                                if (data.unit && data.unit.objectId) {
                                    data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                                }
                            }
                            return angular.toJson(data);
                        }
                    },
                    delete: {
                        method: 'DELETE',
                        headers: UserService.headers()
                    }

                    /*
                     ,
                     queryBetweenDates: {
                     method: "GET",
                     headers: headers,
                     isArray: true,
                     params: {
                     where: {"dateTime": {"$gt": {"__type": "Date", "iso": ":beginDate"}, "&lt": {"__type": "Date", "iso": ":endDate"}}}
                     },
                     transformResponse: function(data) {
                     var jsonResponse = angular.fromJson(data);
                     if (jsonResponse && jsonResponse.results) {
                     jsonResponse = jsonResponse.results;
                     }
                     return jsonResponse;
                     }
                     }
                     */
                });
    }]);




servicesModule.factory('BloodGlucoseTarget', ['$resource', 'UserService', function($resource, UserService) {
        var url = parseBaseUrl + "classes/Target";
        return $resource(url, {},
                {
                    query: {
                        method: "GET",
                        headers: UserService.headers(),
                        isArray: true,
                        transformResponse: function(data) {
                            var jsonResponse = angular.fromJson(data);
                            if (jsonResponse && jsonResponse.results) {
                                jsonResponse = jsonResponse.results;
                            }
                            return jsonResponse;
                        }
                    },
                    save: {
                        method: "POST",
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                            }
                            return angular.toJson(data);
                        }
                    },
                    update: {
                        method: "PUT",
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWrite();
                            }
                            return angular.toJson(data);
                        }
                    }
                });
    }]);



servicesModule.factory('UserPreferences', ['$resource', 'UserService', function($resource, UserService) {
        var url = parseBaseUrl + 'classes/UserPreferences';
        return $resource(url, {},
                {
                    query: {
                        method: 'GET',
                        headers: UserService.headers(),
                        isArray: true,
                        transformResponse: function(data) {
                            var jsonResponse = angular.fromJson(data);
                            if (jsonResponse && jsonResponse.results) {
                                jsonResponse = jsonResponse.results;
                            }
                            return jsonResponse;
                        }
                    },
                    save: {
                        method: 'POST',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                            }
                            return angular.toJson(data);
                        }
                    },
                    update: {
                        method: 'PUT',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWrite();
                            }
                            return angular.toJson(data);
                        }
                    }

                });
    }]);


servicesModule.factory('Period', ['$resource', 'UserService', 'dateUtil', function($resource, UserService, dateUtil) {
        var url = parseBaseUrl + 'classes/Period/:periodId';
        return $resource(url,
                {
                },
                {
                    query: {
                        method: 'GET',
                        headers: UserService.headers(),
                        isArray: true,
                        transformResponse: function(data) {
                            var jsonResponse = angular.fromJson(data);
                            if (jsonResponse && jsonResponse.results) {
                                jsonResponse = jsonResponse.results;
                                jsonResponse = jsonResponse.map(function(period) {
                                    period.begin = dateUtil.convertToNormalFormat(period.begin);
                                    period.end = dateUtil.convertToNormalFormat(period.end);
                                    return period;
                                });
                            }
                            return jsonResponse;
                        }
                    },
                    save: {
                        method: 'POST',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                var dataToSave = angular.extend({}, data);
                                dataToSave.ACL = UserService.ownerReadWriteACL();
                                if (dataToSave.begin && dataToSave.end) {
                                    dataToSave.begin = dateUtil.convertToParseFormat(dataToSave.begin);
                                    dataToSave.end = dateUtil.convertToParseFormat(dataToSave.end);
                                }
                            }
                            return angular.toJson(dataToSave);
                        }
                    },
                    update: {
                        method: 'PUT',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                                if (data.begin && data.end) {
                                    data.begin = dateUtil.convertToParseFormat(data.begin);
                                    data.end = dateUtil.convertToParseFormat(data.end);
                                }
                            }
                            return angular.toJson(data);
                        }
                    },
                    delete: {
                        method: 'DELETE',
                        headers: UserService.headers()
                    }
                });
    }]);


servicesModule.factory('UserService', ['$http', '$cookieStore', function($http, $cookieStore) {
        var UserService = {};
        var user;
        UserService.signUp = function(user) {
            return $http.post(
                    parseBaseUrl + 'users',
                    user,
                    {
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                //data.ACL = UserService.ownerReadWriteACL();
                            }
                            return angular.toJson(data);
                        }
                    });
        };

        UserService.logIn = function(username, password) {
            return $http.get(
                    parseBaseUrl + 'login',
                    {
                        headers: headers,
                        params: {
                            'username': username,
                            'password': password
                        }
                    }
            ).success(function(result) {
                $cookieStore.put('user', result);
                $cookieStore.put('sessionToken', result.sessionToken);
                user = result;
                //headers["X-Parse-Session-Token"] = result.sessionToken;
                return result;
            })
                    .error(function(error) {
                        return error;
                    });

        };
        UserService.logOut = function() {
            user = null;
            $cookieStore.remove('user');
            $cookieStore.remove('sessionToken');
        };


        UserService.requestPasswordReset = function(email) {
            debugger;
            return $http({
                method: 'POST',
                url: parseBaseUrl + 'requestPasswordReset',
                data: angular.toJson({'email': email}),
                headers: headers
            });
        };

        UserService.currentUser = function() {
            return user || $cookieStore.get('user');
        };

        UserService.updateUser = function(updatedUser) {
            if (user && updatedUser) {
                user = angular.extend(user, updatedUser);
            }
            if ($cookieStore.get('user')) {
                var cookieUser = $cookieStore.get('user');
                if (cookieUser) {
                    cookieUser = angular.extend(cookieUser, updatedUser);
                }
                $cookieStore.put('user', cookieUser);
            }
        };


        UserService.ownerReadWriteACL = function() {
            var ownerReadWriteACL = {};
            if (UserService.currentUser()) {
                var user = UserService.currentUser();
                ownerReadWriteACL[user.objectId] = {};
                ownerReadWriteACL[user.objectId].read = true;
                ownerReadWriteACL[user.objectId].write = true;
            }
            return ownerReadWriteACL;
        };

        UserService.everyoneReadACL = function() {
            return {
                "*": "read"
            };
        };

        UserService.headers = function() {
            var headers = {
                "Content-Type": "application/json",
                "X-Parse-Application-Id": applicationId,
                "X-Parse-REST-API-Key": restApiKey
            };
            if (UserService.currentUser() && UserService.currentUser().sessionToken) {
                headers["X-Parse-Session-Token"] = UserService.currentUser().sessionToken;
            }
            return headers;
        };

        UserService.getFirstDayOfWeek = function() {
            var firstDayOfWeek = 0;
            if (UserService.currentUser().preferences && UserService.currentUser().preferences.firstDayOfWeek) {
                firstDayOfWeek = UserService.currentUser().preferences.firstDayOfWeek;
            }
            return firstDayOfWeek;
        };




        return UserService;
    }]);


servicesModule.factory("User", ["$resource", "UserService", function($resource, UserService) {
        var url = parseBaseUrl + "users/:userId";
        return $resource(url,
                {},
                {
                    update: {
                        method: "PUT",
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                                if (data.sessionToken) {
                                    delete data.sessionToken;
                                }
                            }
                            return angular.toJson(data);
                        }
                    }
                });

    }]);


servicesModule.factory("parseRESTService", ["$http", function($http) {


        var parseRESTService = {};
        parseRESTService.get = function(className) {
            var url = parseBaseUrl + "classes/" + className;
            var config = {
                headers: headers
            };
            return $http.get(url, config);
        };

        parseRESTService.put = function() {

        };

        parseRESTService.post = function() {

        };

        return parseRESTService;
    }]);


servicesModule.factory('dateUtil', ['$filter', function($filter) {
        var dateUtil = {};

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

        function dateDiffInDays(a, b) {
            var _MS_PER_DAY = 1000 * 60 * 60 * 24;
            return dateDiff(a, b, _MS_PER_DAY);
        }

        function dateDiffInHours(a, b) {
            var _MS_PER_HOUR = 1000 * 60 * 60;
            return dateDiff(a, b, _MS_PER_HOUR);
        }


        dateUtil.getPeriodMaxDate = function(periodArray, dateField) {
            var maxDate = null;
            if (Array.isArray(periodArray)) {
                periodArray.forEach(function(period) {
                    if (maxDate === null || maxDate < period[dateField]) {
                        maxDate = period[dateField];
                    }
                });
            }
            return maxDate;
        };


        dateUtil.getPeriodMaxEndDate = function(periodArray) {
            return dateUtil.getPeriodMaxDate(periodArray, 'end');
        };

        dateUtil.getPeriodMaxBeginDate = function(periodArray) {
            return dateUtil.getPeriodMaxDate(periodArray, 'begin');
        };


        dateUtil.getNumberOfMillis = function(timeString) {
            var splittedDateString = timeString.split(":");
            var hours = parseInt(splittedDateString[0], 10);
            var minutes = parseInt(splittedDateString[1], 10);
            return (hours * 60 + minutes) * 60 * 1000;
        };

        dateUtil.daysInMonth = function(month, year) {
            return new Date(year, month, 0).getDate();
        };

        dateUtil.getAvailableDays = function(month, year) {
            var numberOfDays = dateUtil.daysInMonth(month, year);
            var day = 1;
            var resultArray = [];
            while (day < numberOfDays) {
                resultArray.push(day);
                day++;
            }
            return resultArray;
        };

        dateUtil.arePeriodsIntersecting = function(periodArray) {
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
        };

        dateUtil.arePeriodIntersecting = function(period1, period2) {
            var period1BeginDate = dateUtil.getDateHourAndMinuteToMillis(period1.begin);
            var period1EndDate = dateUtil.getDateHourAndMinuteToMillis(period1.end);
            var period2BeginDate = dateUtil.getDateHourAndMinuteToMillis(period2.begin);
            var period2EndDate = dateUtil.getDateHourAndMinuteToMillis(period2.end);
            return period1BeginDate > period2BeginDate && period1BeginDate < period2EndDate ||
                    period1EndDate > period2BeginDate && period1EndDate < period2EndDate;
        };

        dateUtil.checkDuration = function(period) {
            var valid = false;
            if (period && period.begin && period.end) {
                valid = dateDiffInHours(period.begin, period.end) <= 24;
            }
            return valid;
        };

        dateUtil.getDateHourAndMinuteToMillis = function(date) {
            var hourCoef = 60 * 60 * 1000;
            var minuteCoef = 60 * 1000;
            return date.getHours() * hourCoef + date.getMinutes() * minuteCoef;
        };

        dateUtil.getMonthWeek = function(date) {
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
            return Math.ceil((date.getDate() + firstDay) / 7);
        };

        dateUtil.weekCount = function(year, month_number) {
            var firstOfMonth = new Date(year, month_number - 1, 1);
            var lastOfMonth = new Date(year, month_number, 0);
            var used = firstOfMonth.getDay() + lastOfMonth.getDate();
            return Math.ceil(used / 7);
        };


        dateUtil.getDateWeekBeginAndEndDate = function(date, indexOfFirstDay) {
            var beginDate = null;
            var endDate = null;
            if (date.getDay() === indexOfFirstDay) {
                beginDate = new Date(date.getTime());
                endDate = new Date(date.getTime());
                endDate.setDate(beginDate.getDate() + 6);

            } else {
                if (date.getDay() < indexOfFirstDay) {
                    var index = date.getDay();
                    while (index < indexOfFirstDay) {
                        index++;
                    }
                    beginDate = new Date(date.getTime());
                    endDate = new Date(date.getTime());
                    beginDate.setDate(date.getDate() + index);
                    endDate.setDate(beginDate.getDate() + 6);
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
                    endDate.setDate(beginDate.getDate() + 6);

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
        };

        dateUtil.getDateMonthBeginAndEndDate = function(date) {
            var beginDate = new Date(date.getFullYear(), date.getMonth());
            var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return {
                name: 'month',
                begin: beginDate,
                end: endDate
            };
        };

        dateUtil.getDateYearBeginAndEndDate = function(date) {
            var beginDate = new Date(date.getFullYear(), 0, 1);
            var endDate = new Date(date.getFullYear() + 1, 0, 0);
            return {
                name: 'year',
                begin: beginDate,
                end: endDate
            };
        };




        dateUtil.getCurrentWeekSundayAndMonday = function() {
            var period = dateUtil.getDateWeekBeginAndEndDate(new Date(), 0);
            var sunday = period.begin;
            var monday = new Date(period.begin.getTime());
            monday.setDate(monday.getDate() + 1);
            return [{index: "0", date: $filter('date')(sunday, 'EEEE')}, {index: "1", date: $filter('date')(monday, 'EEEE')}];
        };


        dateUtil.arePeriodsOnMoreThanOneDay = function(periods) {
            var total = 0;
            var result = 0;
            var max = 86400000;
            for (var index = 0; index < periods.length; index++) {
                var period = periods[index];
                var duration = dateUtil.getDateHourAndMinuteToMillis(period.end) - dateUtil.getDateHourAndMinuteToMillis(period.begin);
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
        };


        dateUtil.getAvailableYears = function() {
            var resultArray = [];
            var yearNumber = 100;
            var startYear = 1970;
            var i = 0;
            while (i < yearNumber) {
                resultArray.push(startYear + i);
                i++;
            }
            return resultArray;
        };

        dateUtil.getAvailableMonths = function() {
            var resultArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            return resultArray;
        };


        dateUtil.convertToNormalFormat = function(parseDate) {
            var normalDate = null;
            if (parseDate && parseDate.iso) {
                var startTimeISOString = parseDate.iso;
                normalDate = new Date(startTimeISOString);
                //normalDate = new Date(normalDate.getTime() + (normalDate.getTimezoneOffset() * 60000));
            }
            return normalDate;
        };

        dateUtil.convertToParseFormat = function(date) {
            var parseDate = null;
            if (date) {
                //{"__type":"Date", "iso":"2012-04-30T09:34:08.256Z"}
                parseDate = {};
                parseDate.__type = "Date";
                parseDate.iso = date.toISOString();
            }
            return parseDate;
        };
        return dateUtil;
    }]);


servicesModule.factory('chartService', ['$q', 'overViewService', 'BloodGlucoseTarget', function($q, overViewService, BloodGlucoseTarget) {
        var chartService = {};
        chartService.getGlucoseReadingData = function(readingGlucoseList) {
            var dataSerie = [];
            if (readingGlucoseList && Array.isArray(readingGlucoseList)) {
                readingGlucoseList.forEach(function(readingGlucose) {
                    var row = [];
                    row[0] = readingGlucose.dateTime.getTime();
                    row[1] = readingGlucose.reading * readingGlucose.unit.coefficient;
                    dataSerie.push(row);
                });
            }
            return dataSerie;
        };

        chartService.getChartDataSeriesFromAggregatedData = function(aggregatedData) {
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



        chartService.getChartAggregatedDataSeries = function(beginDate, endDate, groupBy, includeTarget) {
            var params = {bigResult: isBigResult(beginDate, endDate)};
            var timeInterval = {
                name: groupBy,
                begin: beginDate,
                end: endDate
            };
            var promises = [overViewService.getAggregtedData(timeInterval, params)];
            if (includeTarget) {
                promises.push(BloodGlucoseTarget.query({include: 'unit'}).$promise);
            }
            return $q.all(promises).then(function(results) {
                return chartService.getChartDataSeriesFromAggregatedData(results[0]);
            });
        };


        function isBigResult(beginDate, endDate) {
            var isBigResult = false;
            var maxDays = 100;
            var timeInterval = endDate.getTime() - beginDate.getTime();
            var numberOfDays = timeInterval / (1000 * 60 * 60 * 24);
            if (numberOfDays > maxDays) {
                isBigResult = true;
            }
            return isBigResult;
        }




        return chartService;
    }]);



servicesModule.factory('statsService', ['$filter', function($filter) {
        var statsService = {};

        statsService.getStatsFromBloodGlucoseReadingList = function(bloodGlucoseReadings) {
            var stats = {
                maximum: null,
                minimum: null,
                nb: bloodGlucoseReadings.length,
                _total: 0
            };
            bloodGlucoseReadings.forEach(function(bloodGlucoseReading) {
                var reading = bloodGlucoseReading.reading * bloodGlucoseReading.unit.coefficient;
                if (stats.maximum === null || reading > stats.maximum) {
                    stats.maximum = reading;
                }
                if (stats.minimum === null || reading < stats.minimum) {
                    stats.minimum = reading;
                }
                stats._total += reading;
            });
            stats.average = $filter('number')(stats._total / stats.nb, 0);
            return stats;
        };



        /*
         function processResult(queryResult, params) {
         var processedResult = queryResult;
         //aggregate and / or do stuff
         
         if (params.select) {
         processedResult = [];
         queryResult.forEach(function(row) {
         
         
         
         });
         
         }
         return processedResult;
         }
         
         function aggregateRow(results, newRow, selectedFields){
         
         
         
         results.forEach();
         }
         
         
         function getSelectedFields(params) {
         var selectObj = {};
         if (params.select && Array.isArray(params.select)) {
         params.select.forEach(function(selectElement) {
         selectObj[selectElement.field] = {};
         selectObj[selectElement.field] = angular.extend({},selectElement);
         delete selectObj[selectElement.field].field;
         });
         }
         return selectObj;
         }
         */





        return statsService;
    }]);


servicesModule.factory('dataService', ['$q', function($q) {
        var dataService = {};
        var maxResult = 1000;

        dataService.query = function(resourceObject, params) {
            var deferred = $q.defer();
            if (resourceObject && resourceObject.query) {
                //do parse query
                queryParse(resourceObject, params).then(function(queryResult) {
                    //process result
                    deferred.resolve(processResult(queryResult, params));
                });
            } else {
                deferred.reject(resourceObject + ' is not a resource object');
            }
            return deferred.promise;
        };

        function queryParse(resourceObject, params) {
            if (params.bigResult) {
                //do multiple requests
                return doMultipleRequests(resourceObject, params);
            } else {
                //do normal query
                return doParseQuery(resourceObject, params);
            }
        }

        function doParseQuery(resourceObject, params) {
            var parseParams = {};
            var promise = null;

            if (params.include) {
                parseParams.include = params.include;
            }
            if (params.where) {
                parseParams.where = params.where;
            }
            if (params.limit || params.limit === 0) {
                parseParams.limit = params.limit;
            } else {
                parseParams.limit = maxResult;
            }
            if (params.skip) {
                parseParams.skip = params.skip;
            }
            if (params.count) {
                parseParams.count = params.count;
            }
            if (params.count) {
                promise = resourceObject.count(parseParams).$promise;
            } else {
                promise = resourceObject.query(parseParams).$promise;
            }
            return promise;
        }

        function doMultipleRequests(resourceObject, params) {
            var newParams = angular.extend({}, params);
            newParams.count = 1;
            newParams.limit = 0;
            return doParseQuery(resourceObject, newParams).then(function(result) {
                var queryPromise = null;
                var resultCount = result.count;
                if (resultCount <= maxResult) {
                    queryPromise = doParseQuery(resourceObject, params);
                } else {
                    var requestArray = [];
                    var requestNumber = Math.floor(resultCount / maxResult);
                    var lastRequestCount = resultCount % maxResult;
                    if (lastRequestCount > 0) {
                        requestNumber++;
                    }
                    for (var requestIndex = 0; requestIndex < requestNumber; requestIndex++) {
                        var requestParams = angular.extend({}, params);
                        requestParams.limit = maxResult;
                        requestParams.skip = requestIndex * maxResult;
                        var request = doParseQuery(resourceObject, requestParams);
                        requestArray.push(request);
                    }
                    queryPromise = $q.all(requestArray).then(function(results) {
                        var resultArray = [];
                        for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                            resultArray = resultArray.concat(results[resultIndex]);
                        }
                        return resultArray;
                    });
                }
                return queryPromise;
            });
        }

        dataService.processResult = function(queryResult, params) {
            var processedResult = queryResult;
            //if there is a select or a groupby, do client side data processing
            if (params.select || params.groupBy) {
                processedResult = [];
                var groupByResult = [];

                queryResult.forEach(function(row) {
                    var selectedRow = applySelect(row, params);
                    if (params.groupBy) {
                        applyGroupBy(processedResult, selectedRow, params);
                    } else {
                        processedResult.push(selectedRow);
                    }
                });
            }
            //TODO add having here            
            postProcess(processedResult, params);

            return processedResult;
        };



        function applySelect(row, params) {
            var resultRow = {};
            params.select.forEach(function(selectElement) {
                if (selectElement.field && typeof (row[selectElement.field]) !== 'undefined') {
                    var value = row[selectElement.field];
                    if (selectElement.transform) {
                        value = selectElement.transform(value, row);
                    }
                    if (selectElement.alias) {
                        resultRow[selectElement.alias] = value;
                    } else {
                        resultRow[selectElement.field] = value;
                    }
                }
            });
            return resultRow;
        }

        function applyGroupBy(rows, currentRow, params) {
            var rowToAdd = currentRow;
            var indexOfRow = getIndexOfRowInResult(rows, currentRow, params.groupBy);
            if (indexOfRow !== -1) {
                rows[indexOfRow] = groupRow(params, currentRow, rows[indexOfRow]);
                //rowToAdd = rows[indexOfRow];
            } else {
                rows.push(initNewRow(params, rowToAdd));
            }
        }

        function initNewRow(params, newRow) {
            params.select.forEach(function(selectElement) {
                if (selectElement.aggregate) {
                    var alias = selectElement.field;
                    if (selectElement.alias) {
                        alias = selectElement.alias;
                    }
                    var existingValue = newRow[alias];
                    switch (selectElement.aggregate) {
                        case 'count':
                            newRow[alias] = 1;
                            break;
                        case 'avg':
                            var existingValue = newRow[alias];
                            newRow[alias] = {};
                            newRow[alias].count = 1;
                            newRow[alias].sum = existingValue;
                            break;
                    }
                }
            });
            return newRow;
        }


        function groupRow(params, currentRow, existingRow) {
            params.select.forEach(function(selectElement) {
                if (selectElement.aggregate) {
                    var alias = selectElement.field;
                    if (selectElement.alias) {
                        alias = selectElement.alias;
                    }
                    var existingValue = existingRow[alias];
                    var newValue = currentRow[alias];
                    switch (selectElement.aggregate) {
                        case 'count':
                            existingRow[alias] = existingRow[alias] + 1;
                            break;
                        case 'avg':                            
                            existingRow[alias] = {};                            
                            existingRow[alias].count = existingValue.count + 1;                            
                            existingRow[alias].sum = newValue + existingValue.sum;
                            break;
                        case 'sum':
                            existingRow[alias] = existingValue + newValue;
                            break;
                        case 'max':
                            if (newValue > existingValue) {
                                existingRow[alias] = newValue;
                            }
                            break;
                        case 'min':
                            if (newValue < existingValue) {
                                existingRow[alias] = newValue;
                            }
                            break;
                    }
                }
            });
            return existingRow;
        }

        function postProcess(processedResult, params) {
            var avgFields = getAvgFieldsFromParams(params);
            if (params.having || avgFields.length > 0) {
                for (var indexOfRow = 0; indexOfRow < processedResult.length; indexOfRow++) {
                    avgFields.forEach(function(selectElement) {
                        var alias = selectElement.field;
                        if (selectElement.alias) {
                            alias = selectElement.alias;
                        }
                        var existingValue = processedResult[indexOfRow][alias];                        
                        processedResult[indexOfRow][alias] = existingValue.sum / existingValue.count;
                    });
                }
            }
            return processedResult;
        }

        function getAvgFieldsFromParams(params) {
            var avgFields = [];
            if (params.select) {
                params.select.forEach(function(selectElement) {
                    if (selectElement.aggregate && selectElement.aggregate === 'avg') {
                        avgFields.push(selectElement);
                    }
                });
            }
            return avgFields;
        }


        function getIndexOfRowInResult(rows, currentRow, groupBy) {
            var resultIndex = -1;
            for (var indexOfRow = 0; indexOfRow < rows.length; indexOfRow++) {
                var rowEquals = true;
                groupBy.forEach(function(groupByField) {
                    if (currentRow[groupByField] !== rows[indexOfRow][groupByField]) {
                        rowEquals = false;
                        return;
                    }
                });
                if (rowEquals) {
                    resultIndex = indexOfRow;
                    break;
                }
            }
            return resultIndex;
        }



        return dataService;
    }]);


servicesModule.factory('overViewService', ['$q', '$filter', 'UserService', 'Period', 'ReadingGlucoseBlood', 'dateUtil', 'statsService', 'dataService', function($q, $filter, UserService, Period, ReadingGlucoseBlood, dateUtil, statsService, dataService) {
        var overViewService = {};

        function getBloodGlucoseReadingsBetweenDates(beginDate, endDate, params) {
            /*
             return ReadingGlucoseBlood.query({
             include: 'unit',
             where: '{"dateTime": {"$gt": {"__type": "Date", "iso":"' + beginDate.toISOString() + '"}, "$lt": {"__type": "Date", "iso":"' + endDate.toISOString() + '"}}}',
             limit: 1000
             }).$promise;
             */
            var queryParams = angular.extend({
                include: 'unit',
                where: '{"dateTime": {"$gt": {"__type": "Date", "iso":"' + beginDate.toISOString() + '"}, "$lt": {"__type": "Date", "iso":"' + endDate.toISOString() + '"}}}',
                limit: 1000
            }, params);
            return dataService.query(ReadingGlucoseBlood, queryParams);
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
                default:
                    analysisPeriodPromise = getWeekAnalysisPeriod(timeInterval);
                    break;
            }
            return analysisPeriodPromise;
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
            while (baseDate.getMonth() < timeInterval.end.getMonth()) {
                var index = 0;
                while (baseDate.getMonth() === month) {
                    var analysisPeriod = dateUtil.getDateWeekBeginAndEndDate(baseDate, firstDayOfWeek);
                    analysisPeriod.name = $filter('date')(baseDate, 'MMMM yyyy') + " week " + (index + 1);
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
            return Period.query().$promise.then(function(analysisPeriods) {
                var result = [];
                if (analysisPeriods && Array.isArray(analysisPeriods) && analysisPeriods.length > 0) {
                    result = analysisPeriods;
                } else {
                    //get default values
                }
                return result;
            });
        }



        function isDateInPeriod(timeIntervalName, date, period) {
            var isPeriodInDate = false;
            if (timeIntervalName === 'week') {
                var dateMillis = dateUtil.getDateHourAndMinuteToMillis(date);
                var periodBeginMillis = dateUtil.getDateHourAndMinuteToMillis(period.begin);
                var periodEndMillis = dateUtil.getDateHourAndMinuteToMillis(period.end);
                isPeriodInDate = dateMillis >= periodBeginMillis && dateMillis < periodEndMillis;
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


        overViewService.getTimeInterval = function(intervalName, date) {
            var timeInterval = null;
            switch (intervalName) {
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



        overViewService.getTableData = function(timeInterval) {
            var dataPromise = null;
            switch (timeInterval.name) {
                case 'week':
                    dataPromise = overViewService.getWeekData(timeInterval);
                    break;
                case 'month':
                    dataPromise = overViewService.getAggregtedData(timeInterval);
                    break;
                case 'year':
                    dataPromise = overViewService.getAggregtedData(timeInterval, {bigResult: true});
                    break;
                default:
                    dataPromise = overViewService.getWeekData(timeInterval);
                    break;
            }
            return dataPromise;
        };


        overViewService.getAggregtedData = function(timeInterval, params) {
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
                bloodGlucoseReadings.forEach(function(bloodGlucoseReading) {
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



        overViewService.getWeekData = function(timeInterval) {
            return $q.all([
                getBloodGlucoseReadingsBetweenDates(timeInterval.begin, timeInterval.end),
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
                    var dayOfMonth = dayDate.getDate() + (indexOfDay - 1);
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
                bloodGlucoseReadings.forEach(function(bloodGlucodeReading) {
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
        return overViewService;
    }]);





servicesModule.factory('importService', ['ReadingGlucoseBlood', 'dateUtil', '$upload', '$http', '$q', function(ReadingGlucoseBlood, dateUtil, $upload, $http, $q) {
        var importService = {};
        var uploadUrl = parseBaseUrl + 'files/';
        var fileHeaders = angular.extend({'Content-Type': 'text/plain'}, headers);

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


        importService.uploadFile = function(file) {
            uploadUrl = uploadUrl + file.name;
            return $upload.upload({
                url: uploadUrl,
                method: 'POST',
                headers: fileHeaders,
                // withCredentials: true,
                //data: {myObj: $scope.myModelObj},
                file: file // or list of files: $files for html5 only
                        /* set the file formData name ('Content-Desposition'). Default is 'file' */
                        //fileFormDataName: myFile, //or a list of names for multiple files (html5).
                        /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
                        //formDataAppender: function(formData, key, val){}
            });
            //.error(...)
            //.then(success, error, progress); 
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})// access and attach any event listener to XMLHttpRequest.
        };


        importService.downloadFile = function(fileLocation) {
            return $http.get(fileLocation);
        };


        importService.processFile = function(file) {
            var dataArray = CSVToArray(file, ";");
            var promiseArray = [];
            dataArray.forEach(function(line) {
                var promise = importService.processLine(line);
                if (promise) {
                    promiseArray.push(promise);
                }
            });

            $q.all(promiseArray).then(function resolve(result) {
                debugger;
            },
                    function reject(error) {
                        debugger;
                    },
                    function progress(progress) {
                        debugger;
                    }
            );
        };

        importService.processLine = function(dataArray) {
            //gly => 29
            //dateTime => 3          
            var returnValue = null;
            var readingGlucoseBlood = {};
            if (dataArray.length >= 29 && dataArray[29] && dataArray[3] && dataArray[0] !== "Index") {
                readingGlucoseBlood.reading = parseInt(dataArray[29]);
                readingGlucoseBlood.dateTime = processDateTime(dataArray[3]);
                readingGlucoseBlood.unit = {objectId: "0Erp4POX9d"};
                returnValue = ReadingGlucoseBlood.save({}, readingGlucoseBlood);
            }
            return returnValue;
        };

        // This will parse a delimited string into an array of
        // arrays. The default delimiter is the comma, but this
        // can be overriden in the second argument.
        function CSVToArray(strData, strDelimiter) {
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");

            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                    (
                            // Delimiters.
                            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                            // Quoted fields.
                            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                            // Standard fields.
                            "([^\"\\" + strDelimiter + "\\r\\n]*))"
                            ),
                    "gi"
                    );


            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [[]];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;


            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = objPattern.exec(strData)) {
                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];
                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push([]);
                }


                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[ 2 ]) {

                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    var strMatchedValue = arrMatches[ 2 ].replace(
                            new RegExp("\"\"", "g"),
                            "\""
                            );

                } else {

                    // We found a non-quoted value.
                    var strMatchedValue = arrMatches[ 3 ];

                }


                // Now that we have our value string, let's add
                // it to the data array.
                arrData[ arrData.length - 1 ].push(strMatchedValue);
            }

            // Return the parsed data.
            return(arrData);
        }
        return importService;
    }]);