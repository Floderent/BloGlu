'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('UserService', ['$http', '$cookieStore', 'ServerService', 'indexeddbService', function($http, $cookieStore, ServerService, indexeddbService) {
        var UserService = {};
        var user;
        UserService.signUp = function(user) {
            return $http.post(
                    ServerService.baseUrl + 'users',
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
                    ServerService.baseUrl + 'login',
                    {
                        headers: ServerService.headers,
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
            indexeddbService.dropDatabase().then(function() {
                $cookieStore.remove('user');
                $cookieStore.remove('sessionToken');
            }, function(error) {
                $cookieStore.remove('user');
                $cookieStore.remove('sessionToken');
            });
        };


        UserService.requestPasswordReset = function(email) {
            debugger;
            return $http({
                method: 'POST',
                url: ServerService.baseUrl + 'requestPasswordReset',
                data: angular.toJson({'email': email}),
                headers: ServerService.headers
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
                "X-Parse-Application-Id": ServerService.applicationId,
                "X-Parse-REST-API-Key": ServerService.restApiKey
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




servicesModule.factory('chartService', ['$q', 'overViewService', 'dataService', function($q, overViewService, dataService) {
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
            return $q.all(promises).then(function(results) {
                return chartService.getChartDataSeriesFromAggregatedData(results[0]);
            });
        };

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


        return statsService;
    }]);




servicesModule.factory('overViewService', ['$q', '$filter', 'UserService', 'Period', 'Event', 'dateUtil', 'statsService', 'dataService', 'ModelUtil', function($q, $filter, UserService, Period, Event, dateUtil, statsService, dataService, ModelUtil) {
        var overViewService = {};

        function getBloodGlucoseReadingsBetweenDates(beginDate, endDate, params) {
            //{dateTime:{$gt: {__type: "Date", iso: beginDate.toISOString()},$lt: {__type: "Date", iso: endDate.toISOString()}}}          
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
            return dataService.queryLocal('Period').then(function(analysisPeriods) {
                var result = [];
                if (analysisPeriods && Array.isArray(analysisPeriods) && analysisPeriods.length > 0) {
                    result = analysisPeriods;
                    result.sort(function(a, b) {                        
                        return (a.begin.getHours() * 60 + a.begin.getMinutes()) > (b.begin.getHours() * 60 + b.begin.getMinutes());
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


        overViewService.getTimeInterval = function(intervalName, date) {
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



        overViewService.getTableData = function(timeInterval, params) {
            var dataPromise = null;
            var dataParams = angular.extend({}, params);
            switch (timeInterval.name) {
                case 'day':
                    dataPromise = overViewService.getDayData(timeInterval, dataParams);
                    break;
                case 'week':
                    dataPromise = overViewService.getWeekData(timeInterval, dataParams);
                    break;
                case 'month':
                    dataPromise = overViewService.getAggregtedData(timeInterval, dataParams);
                    break;
                case 'year':
                    dataPromise = overViewService.getAggregtedData(timeInterval, dataParams);
                    break;
                default:
                    dataPromise = overViewService.getWeekData(timeInterval, dataParams);
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



        overViewService.getWeekData = function(timeInterval, params) {
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

        overViewService.getDayData = function(timeInterval, params) {
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
                bloodGlucoseReadings.forEach(function(bloodGlucoseReading) {
                    var indexOfColumn = getBloodGlucoseReadingColumnByDate(timeInterval, analysisPeriods, bloodGlucoseReading.dateTime);
                    if (Array.isArray(dataArray[indexOfRow][indexOfColumn])) {
                        dataArray[indexOfRow][indexOfColumn].push(bloodGlucoseReading);
                    }
                });
                return dataArray;
            });
        };

        return overViewService;
    }]);

servicesModule.factory('printService', [function() {
        var printService = {};
        printService.convertTableToPDF = function(tableData, renderCellFunction) {
            debugger;
            var doc = new jsPDF('l', 'pt', 'a4', true);
            doc.cellInitialize();
            for (var rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
                var row = tableData[rowIndex];
                for (var columnIndex = 0; columnIndex < row.length; columnIndex++) {
                    var cell = row[columnIndex];
                    doc.cell(10, 50, 120, 50, renderCellFunction(rowIndex, columnIndex, cell, tableData), rowIndex);
                }
                ;
            }
            doc.save('sample-file.pdf');
        };
        return printService;
    }]);



servicesModule.factory('importService', ['Event', 'dateUtil', '$upload', '$http', '$q', 'ServerService', function(Event, dateUtil, $upload, $http, $q, ServerService) {
        var importService = {};
        var uploadUrl = ServerService.baseUrl + 'files/';
        var fileHeaders = angular.extend({'Content-Type': 'text/plain'}, ServerService.headers);

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
            var event = {};
            if (dataArray.length >= 29 && dataArray[29] && dataArray[3] && dataArray[0] !== "Index") {
                event.reading = parseInt(dataArray[29]);
                event.dateTime = processDateTime(dataArray[3]);
                event.unit = {objectId: "0Erp4POX9d"};
                event.code = 1;
                returnValue = Event.save({}, event);
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