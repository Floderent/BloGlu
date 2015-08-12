(function () {
    'use strict';

    angular.module('bloglu.engine')
            .factory('dataService', dataService);

    dataService.$inject = ['$q', '$filter', '$injector', '$locale', 'indexeddbService', 'Database', 'Utils', 'UserSessionService'];

    function dataService($q, $filter, $injector, $locale, indexeddbService, Database, Utils, UserSessionService) {
        /*
        var dataService = {};
        var localData = null;
        var maxResult = 1000;
        var idField = 'objectId';
        */
       
       var select = {
            //Year
            year: function (value, row) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = value.getFullYear();
                }
                return returnValue;
            },
            //MonthName
            monthName: function (value, row) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = this.$filter('date')(value, 'MMMM');
                }
                return returnValue;
            }.bind({$filter: $filter}),
            //Month
            month: function (value, row, localData) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = value.getMonth() + 1;
                }
                return returnValue;
            },
            //weekDay
            weekDay: function (value, row, localData) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = this.$filter('date')(value, 'EEEE');
                }
                return returnValue;
            }.bind({$filter: $filter}),
            getEventReading: function (value, row, localData, queryElement) {
                var returnValue = null;
                var filter = angular.fromJson(queryElement.filter);
                var code = filter['code'];
                if (typeof code !== 'undefined' && row['code'] === code) {
                    returnValue = value;
                    returnValue = returnValue * row.unit.coefficient;
                    if (Utils.getDefaultUnit(localData, code) && Utils.getDefaultUnit(localData, code).coefficient) {
                        returnValue = returnValue * Utils.getDefaultUnit(localData, code).coefficient;
                    }
                }
                return returnValue;
            },
            //getBloodGlucose
            getBloodGlucose: function (value, row, localData) {
                return Utils.getConvertedReading(value, row, localData, 1);
            },
            //get weight
            getWeight: function (value, row, localData) {
                return Utils.getConvertedReading(value, row, localData, 3);
            },
            getAnalysisPeriod: function (dateTime, row, localData) {
                var returnValue = '';
                var periods = localData.Period;
                angular.forEach(periods, function (period) {
                    var dateHours = dateTime.getHours();
                    var dateMinutes = dateTime.getMinutes();

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
                        returnValue = period.name;
                        return;
                    } else {
                        if (dateHours === beginDateHours && dateMinutes >= beginDateMinutes && dateHours < endDateHours) {
                            returnValue = period.name;
                            return;
                        } else {
                            if (dateHours > beginDateHours && dateHours === endDateHours && dateMinutes <= endDateMinutes) {
                                returnValue = period.name;
                                return;
                            } else {
                                //bad
                            }
                        }
                    }
                });
                return returnValue;
            },
            getBloodGlucoseRange: function (reading, row, localData) {
                var ranges = localData.Range;
                var convertedReading = reading * row.unit.coefficient;
                var returnValue = '';
                angular.forEach(ranges, function (range) {
                    if (convertedReading >= range.lowerLimit * range.unit.coefficient && convertedReading < range.upperLimit * range.unit.coefficient) {
                        returnValue = " >= " + range.lowerLimit + " < " + range.upperLimit;
                        return;
                    }
                });
                return returnValue;
            }

        };

        var where = [
            {
                id: 'currentYear',
                title: 'currentYear',
                field: 'dateTime',
                filterFunction: function () {
                    var date = new Date();
                    var beginDate = new Date(date.getFullYear(), 0, 1);
                    var endDate = new Date(date.getFullYear() + 1, 0, 0);
                    return {$gt: beginDate, $lt: endDate};
                }
            },
            //last year
            {
                id: 'currentMonth',
                title: 'currentMonth',
                field: 'dateTime',
                filterFunction: function () {
                    var date = new Date();
                    var beginDate = new Date(date.getFullYear(), date.getMonth());
                    var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    return {$gt: beginDate, $lt: endDate};
                }
            },
            //last month
            {
                id: 'lastSevenDays',
                title: 'lastSevenDays',
                field: 'dateTime',
                filterFunction: function () {
                    var date = new Date();
                    var endDate = new Date();
                    var beginDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    beginDate.setDate(beginDate.getDate() - 7);
                    return {$gt: beginDate, $lt: endDate};
                }
            },
            //current week            
            //last week            
            //custom
            {
                id: 'customBetweenDates',
                title: 'customBetweenDates',
                field: 'dateTime',
                filterFunction: function (filterParams) {
                    var filter = null;
                    if (filterParams && filterParams.beginDate && filterParams.endDate) {
                        filter = {$gt: new Date(filterParams.beginDate), $lt: new Date(filterParams.endDate)};
                    }
                    return filter;
                },
                customParameters: ['beginDate', 'endDate']
            }
        ];


        var sort = {
            dayName: function (a, b) {
                var datetime = this.$locale.DATETIME_FORMATS;
                var days = datetime.DAY;
                var indexOfA = days.indexOf(a);
                var indexOfB = days.indexOf(b);
                return indexOfA - indexOfB;
            }.bind({$locale: $locale}),
            monthName: function (a, b) {
                var datetime = this.$locale.DATETIME_FORMATS;
                var months = datetime.MONTH;
                var indexOfA = months.indexOf(a);
                var indexOfB = months.indexOf(b);
                return indexOfA - indexOfB;
            }.bind({$locale: $locale})
        };
        
        var operators = {
            $in: function (value, comparison) {
                var match = false;
                if (Array.isArray(comparison)) {
                    if (comparison.indexOf(value) !== -1) {
                        match = true;
                    }
                }
                return match;
            },
            $gt: function (value, comparison) {
                return value >= comparison;
            },
            $lt: function (value, comparison) {
                return value < comparison;
            },
            $neq: function (value, comparison) {
                return value !== comparison;
            },
            $eq: function (value, comparison) {
                return value === comparison;
            }
        };
        
        
        var service = {
            localData: null,
            maxResult: 1000,
            idField: 'objectId',
            logOut: logOut,
            init: init,
            clear: clear,
            addRecords: addRecords,
            clearWholeDatabase: clearWholeDatabase,
            getWholeDatabase: getWholeDatabase,
            save: save,
            update: update,
            remove: remove,
            queryLocal: queryLocal,
            get: get,
            query: query,
            queryParse: queryParse,
            processResult: processResult,
            orderBy: orderBy,
            select: select,
            where: where,
            sort: sort
        };
        return service;
        
        
        


         function logOut() {
            service.localData = null;
            return service.clearWholeDatabase().then(function () {
                return UserSessionService.logOut();
            });
        };


        function init(forceRefresh) {            
            var deferred = $q.defer();
            if (service.localData === null || forceRefresh) {                
                service.getWholeDatabase().then(function (result) {                    
                    service.localData = result;
                    deferred.resolve(result);
                }, deferred.reject);            
            } else {
                deferred.resolve(service.localData);
            }            
            return deferred.promise;
        };

        function clear(collection) {
            var deferred = $q.defer();
            indexeddbService.clear(collection, UserSessionService.getUserId()).then(deferred.resolve, deferred.reject, deferred.notify);
            return deferred.promise;
        };

        function addRecords(collection, records) {
            var userId = UserSessionService.getUserId();
            return indexeddbService.addRecords(collection, userId, records);
        };

        function clearWholeDatabase() {
            var deferred = $q.defer();
            var promiseArray = [];
            angular.forEach(Database.schema, function (collectionName) {
                promiseArray.push(indexeddbService.clear(collectionName, UserSessionService.getUserId()));
            });
            $q.all(promiseArray).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        };


        function getWholeDatabase() {
            var deferred = $q.defer();
            var promiseArray = [];
            if (UserSessionService.getCurrentUser()) {
                angular.forEach(Database.schema, function (collectionName) {
                    promiseArray.push(indexeddbService.getData(collectionName, UserSessionService.getUserId()));
                });
            }
            $q.all(promiseArray).then(function (result) {
                var allData = {};
                for (var i = 0; i < result.length; i++) {
                    allData[Database.schema[i]] = result[i];
                }
                deferred.resolve(allData);
            }, deferred.reject);
            return deferred.promise;
        };


        function save(collection, data, params) {
            return service.init().then(function (localData) {
                //save to indexedDB and to the cloud
                var resource = $injector.get(collection)(UserSessionService.headers());
                var createdObject = angular.extend({}, data);
                return resource.save(data).$promise.then(function (result) {
                    createdObject[service.idField] = result[service.idField];
                    //save in local data
                    updateObjectInfos(createdObject, true);
                    if (localData && localData[collection]) {
                        localData[collection].push(createdObject);
                    }
                    return indexeddbService.addRecord(collection, createdObject).then(function (indexedDBResult) {
                        return createdObject;
                    });
                });
            });
        };

        function update(collection, objectId, data, params) {
            return service.init().then(function (localData) {
                var resource = $injector.get(collection)(UserSessionService.headers());
                //save in local data
                var updatedObject = null;
                if (localData && localData[collection]) {
                    angular.forEach(localData[collection], function (record, index) {
                        if (record[service.idField] === objectId) {
                            updatedObject = angular.extend(localData[collection][index], data);
                            updateObjectInfos(updatedObject, false);
                            localData[collection][index] = updatedObject;
                        }
                    });
                }
                //remove userId field
                delete data.userId;
                //save to indexedDB add to the cloud
                return $q.all([
                    indexeddbService.addRecord(collection, updatedObject),
                    resource.update({'Id': objectId}, data).$promise
                ]).then(function (results) {
                    return updatedObject;
                });
            });
        };

        function updateObjectInfos(object, isCreate) {
            var currentDate = new Date();
            if (object) {
                if (isCreate) {
                    object.createdAt = currentDate.toISOString();
                }
                object.updatedAt = currentDate.toISOString();
            }
        }


        function remove(collection, objectId, params) {
            return service.init().then(function (localData) {
                //save in local data
                if (localData && localData[collection]) {
                    angular.forEach(localData[collection], function (record, index) {
                        if (record[service.idField] === objectId) {
                            localData[collection].splice(index, 1);
                        }
                    });
                }
                //save to indexedDB add to the cloud
                var resource = $injector.get(collection)(UserSessionService.headers());
                var recordToDelete = {};
                recordToDelete[service.idField] = objectId;
                return $q.all([
                    indexeddbService.deleteRecord(collection, recordToDelete),
                    resource.delete({'Id': objectId}).$promise
                ]).then(function (results) {
                    return results[1];
                });
            });
        };

        function queryLocal(collection, params) {
            return service.init().then(function (localData) {
                return service.processResult(localData[collection], params);
            });
        };

        function get(collection, objectId) {
            return service.init().then(function (localData) {
                var results = service.processResult(localData[collection], {where: {objectId: objectId}});
                var result = null;
                if (results && results.length === 1) {
                    result = angular.copy(results[0]);
                }
                return result;
            });
        };


        function query(resourceObject, params) {
            var deferred = $q.defer();
            if (resourceObject && resourceObject.query) {
                //do parse query
                queryParse(resourceObject, params).then(function (queryResult) {
                    //process result
                    deferred.resolve(service.processResult(queryResult, params));
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
            if (params && params.include) {
                parseParams.include = params.include;
            }
            if (params && params.where) {
                parseParams.where = params.where;
            }
            if (params && (params.limit || params.limit === 0)) {
                parseParams.limit = params.limit;
            } else {
                parseParams.limit = service.maxResult;
            }
            if (params && params.skip) {
                parseParams.skip = params.skip;
            }
            if (params && params.count) {
                parseParams.count = params.count;
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
            return doParseQuery(resourceObject, newParams).then(function (result) {
                var queryPromise = null;
                var resultCount = result.count;
                if (resultCount <= service.maxResult) {
                    queryPromise = doParseQuery(resourceObject, params);
                } else {
                    var requestArray = [];
                    var requestNumber = Math.floor(resultCount / service.maxResult);
                    var lastRequestCount = resultCount % service.maxResult;
                    if (lastRequestCount > 0) {
                        requestNumber++;
                    }
                    for (var requestIndex = 0; requestIndex < requestNumber; requestIndex++) {
                        var requestParams = angular.extend({}, params);
                        requestParams.limit = service.maxResult;
                        requestParams.skip = requestIndex * service.maxResult;
                        var request = doParseQuery(resourceObject, requestParams);
                        requestArray.push(request);
                    }
                    queryPromise = $q.all(requestArray).then(function (results) {
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

        function queryParse(collection, resourceCount, params) {
            var deferred = $q.defer();

            var resourceObject = $injector.get(collection)(UserSessionService.headers());
            if (resourceCount <= service.maxResult) {
                doParseQuery(resourceObject, params).then(deferred.resolve, deferred.reject);
            } else {
                var requestArray = [];
                var requestNumber = Math.floor(resourceCount / service.maxResult);
                var lastRequestCount = resourceCount % service.maxResult;
                if (lastRequestCount > 0) {
                    requestNumber++;
                }
                for (var requestIndex = 0; requestIndex < requestNumber; requestIndex++) {
                    var requestParams = angular.extend({}, params);
                    requestParams.limit = service.maxResult;
                    requestParams.skip = requestIndex * service.maxResult;
                    var request = doParseQuery(resourceObject, requestParams);
                    requestArray.push(request);
                }
                $q.all(requestArray).then(function (results) {
                    var resultArray = [];
                    for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
                        resultArray = resultArray.concat(results[resultIndex]);
                    }
                    deferred.resolve(resultArray);
                }, deferred.reject);
            }
            return deferred.promise;
        };



        function processResult(queryResult, params) {
            var processedResult = queryResult;
            processedResult = [];
            var resultSize = 0;
            if(queryResult){
                resultSize = queryResult.length;
            }            
            var isGrouped = params && params.groupBy || containsOnlyAggregates(params);
            for (var i = 0; i < resultSize; i++) {
                var row = queryResult[i];
                if (applyWhere(row, params)) {
                    var selectedRow = applySelect(row, params);
                    if (isGrouped) {
                        applyGroupBy(processedResult, selectedRow, params);
                    } else {
                        processedResult.push(selectedRow);
                    }
                }
            }
            //TODO add having here            
            postProcess(processedResult, params);
            applyOrderBy(processedResult, params);

            return processedResult;
        };

        function containsOnlyAggregates(params) {
            var containsOnlyAggregates = true;
            if (params && params.select) {
                angular.forEach(params.select, function (queryElement) {
                    if (!queryElement.aggregate) {
                        containsOnlyAggregates = false;
                        return;
                    }
                });
            } else {
                containsOnlyAggregates = false;
            }
            return containsOnlyAggregates;
        }


        function applyWhere(row, params) {
            var keepRecord = true;
            if (params && params.where) {
                angular.forEach(params.where, function (value, key) {
                    if (typeof value === 'object') {
                        angular.forEach(value, function (comparisonValue, operator) {
                            if (operators[operator] && !operators[operator](row[key], comparisonValue)) {
                                keepRecord = false;
                                return;
                            }
                        });
                        if (!keepRecord) {
                            return;
                        }
                    } else {
                        if (row[key] !== value) {
                            keepRecord = false;
                            return;
                        }
                    }
                });
            }
            return keepRecord;
        }


        function applySelect(row, params) {
            var resultRow = {};
            if (!params || !params.select) {
                resultRow = angular.extend(resultRow, row);
            } else {
                angular.forEach(params.select, function (selectElement) {
                    if ((selectElement.field && typeof (row[selectElement.field]) !== 'undefined') || selectElement.field.indexOf('.') !== -1) {
                        var value = row[selectElement.field];
                        if (selectElement.field.indexOf('.') !== -1) {
                            value = row;
                            var splittedField = selectElement.field.split('.');
                            angular.forEach(splittedField, function (fieldPart) {
                                if (value[fieldPart] && typeof value[fieldPart] !== 'undefined') {
                                    value = value[fieldPart];
                                } else {
                                    value = '';
                                    return;
                                }
                            });
                        }
                        if (selectElement.transform) {
                            value = selectElement.transform(value, row, service.localData, selectElement);
                        }
                        if (selectElement.alias) {
                            resultRow[selectElement.alias] = value;
                        } else {
                            resultRow[selectElement.field] = value;
                        }
                    }
                });
            }
            return resultRow;
        }

        function applyGroupBy(rows, currentRow, params) {
            var rowToAdd = currentRow;
            var indexOfRow = getIndexOfRowInResult(rows, currentRow, params);
            if (indexOfRow !== -1) {
                rows[indexOfRow] = groupRow(params, currentRow, rows[indexOfRow]);
            } else {
                rows.push(initNewRow(params, rowToAdd));
            }
        }

        function initNewRow(params, newRow) {
            angular.forEach(params.select, function (selectElement) {
                if (selectElement.aggregate) {
                    var alias = selectElement.field;
                    if (selectElement.alias) {
                        alias = selectElement.alias;
                    }
                    var existingValue = newRow[alias];
                    switch (selectElement.aggregate) {
                        case 'count':
                            if (existingValue) {
                                newRow[alias] = 1;
                            } else {
                                newRow[alias] = null;
                            }
                            break;
                        case 'avg':
                            var existingValue = newRow[alias];
                            newRow[alias] = {};
                            if (existingValue) {
                                newRow[alias].count = 1;
                            } else {
                                newRow[alias].count = null;
                            }
                            newRow[alias].sum = existingValue;
                            break;
                    }
                }
            });
            return newRow;
        }


        function groupRow(params, currentRow, existingRow) {
            angular.forEach(params.select, function (selectElement) {
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
                            if (newValue) {
                                existingRow[alias] = {};
                                existingRow[alias].count = existingValue.count + 1;
                                existingRow[alias].sum = newValue + existingValue.sum;
                            }
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
            var fieldsToFormat = getFieldsToFormatFromParams(params);
            var processedResultLength = processedResult.length;
            for (var indexOfRow = 0; indexOfRow < processedResultLength; indexOfRow++) {
                computeAverage(processedResult[indexOfRow], avgFields);
                formatRow(processedResult[indexOfRow], fieldsToFormat);
            }
            return processedResult;
        }


        function computeAverage(row, avgFields) {
            angular.forEach(avgFields, function (selectElement) {
                var existingValue = row[selectElement.alias];
                if (existingValue.count) {
                    row[selectElement.alias] = existingValue.sum / existingValue.count;
                } else {
                    row[selectElement.alias] = '';
                }
            });
        }

        function formatRow(row, fieldsToFormat) {
            angular.forEach(fieldsToFormat, function (fieldToFormat) {
                row[fieldToFormat.alias] = fieldToFormat.formatFunc(row[fieldToFormat.alias]);
            });
        }

        function applyOrderBy(processedResult, params) {
            var result = processedResult;
            if (params && params.orderBy && Array.isArray(params.orderBy) && params.orderBy.length > 0)
                processedResult.sort(function (rowA, rowB) {
                    var sortResult = 0;
                    for (var i = 0; i < params.orderBy.length; i++) {
                        var orderClause = params.orderBy[i];
                        var sortValueA = rowA[orderClause.alias];
                        var sortValueB = rowB[orderClause.alias];
                        if (orderClause.sort) {
                            var sortFunction = null;
                            if (typeof orderClause.sort === 'function') {
                                sortFunction = orderClause.sort;
                            } else {
                                if (typeof service.sort[orderClause.sort] === 'function') {
                                    sortFunction = service.sort[orderClause.sort];
                                }
                            }
                            if (sortFunction) {
                                sortResult = sortFunction(sortValueA, sortValueB);
                            }
                        } else {
                            sortResult = defaultSort(sortValueA, sortValueB);
                        }
                        if (orderClause.direction && orderClause.direction.toUpperCase() === 'DESC') {
                            sortResult = -sortResult;
                        }
                        if (sortResult !== 0) {
                            break;
                        }
                    }
                    return sortResult;
                });
            return result;
        }

        function defaultSort(valueA, valueB) {
            var sortResult = 0;
            if (valueA > valueB) {
                sortResult = 1;
            } else {
                if (valueA < valueB) {
                    sortResult = -1;
                }
            }
            return sortResult;
        }


        function getAvgFieldsFromParams(params) {
            var avgFields = [];
            if (params && params.select) {
                angular.forEach(params.select, function (selectElement) {
                    if (selectElement.aggregate && selectElement.aggregate === 'avg') {
                        var alias = selectElement.field;
                        if (selectElement.alias) {
                            alias = selectElement.alias;
                        }
                        avgFields.push({alias: alias});
                    }
                });
            }
            return avgFields;
        }

        function getFieldsToFormatFromParams(params) {
            var fieldsToFormat = [];
            if (params && params.select) {
                angular.forEach(params.select, function (selectElement) {
                    if (selectElement.aggregate) {
                        var alias = selectElement.field;
                        if (selectElement.alias) {
                            alias = selectElement.alias;
                        }
                        var fieldFormat = {
                            alias: alias
                        };
                        switch (selectElement.aggregate) {
                            case 'count':
                                fieldFormat.formatFunc = function (value) {
                                    return $filter('number')(value, 0);
                                };
                                break;
                            case 'avg':
                            case 'sum':
                            case 'max':
                            case 'min':
                                fieldFormat.formatFunc = function (value) {
                                    return $filter('number')(value, 2);
                                };
                                break;
                        }
                        ;
                        fieldsToFormat.push(fieldFormat);
                    }
                });
            }
            return fieldsToFormat;
        }



        function getIndexOfRowInResult(rows, currentRow, params) {
            var resultIndex = -1;
            if (containsOnlyAggregates(params) && (!params.groupBy || params.groupBy.length === 0)) {
                if (rows.length === 0) {
                    resultIndex = -1;
                } else {
                    resultIndex = 0;
                }
            } else {
                var groupBy = params.groupBy;
                for (var indexOfRow = 0; indexOfRow < rows.length; indexOfRow++) {
                    var rowEquals = true;
                    angular.forEach(groupBy, function (groupByField) {
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
            }
            return resultIndex;
        }


        function orderBy(data, orderBy) {
            var params = {};
            params.orderBy = orderBy;
            return applyOrderBy(data, params);
        };

        

    }
})();