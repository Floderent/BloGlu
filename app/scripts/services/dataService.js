'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('dataService', ['$q', '$filter', '$injector', '$locale', 'indexeddbService', 'Database', 'UserService', function($q, $filter, $injector, $locale, indexeddbService, Database, UserService) {
        var dataService = {};
        var localData = null;
        var maxResult = 1000;
        var idField = 'objectId';

        var operators = {
            $in: function(value, comparison) {
                var match = false;
                if (Array.isArray(comparison)) {
                    if (comparison.indexOf(value) !== -1) {
                        match = true;
                    }
                }
                return match;
            },
            $gt: function(value, comparison) {
                return value >= comparison;
            },
            $lt: function(value, comparison) {
                return value < comparison;
            }
        };
        
        
        dataService.logOut = function(){
            localData = null;
            return dataService.clearWholeDatabase().then(function(){
                return UserService.logOut();
            });
        };
        

        dataService.init = function(forceRefresh) {
            var deferred = $q.defer();
            if (localData === null || forceRefresh) {
                dataService.getWholeDatabase().then(function(result) {
                    localData = result;
                    deferred.resolve(result);
                }, deferred.reject);
            } else {
                deferred.resolve(localData);
            }
            return deferred.promise;
        };

        dataService.clear = function(collection) {
            var deferred = $q.defer();
            indexeddbService.getData(collection, UserService.currentUser().objectId).then(function(userDatas) {
                var deletePromiseArray = [];
                angular.forEach(userDatas, function(record) {
                    deletePromiseArray.push(indexeddbService.deleteRecord(collection, record));
                });
                $q.all(deletePromiseArray).then(deferred.resolve, deferred.reject);
            }, deferred.reject);
            return deferred.promise;

        };

        dataService.addRecords = function(collection, records) {
            var userId = UserService.currentUser().objectId;
            angular.forEach(records, function(record) {
                record.userId = userId;
            });
            return indexeddbService.addRecords(collection, records);
        };
        
        dataService.clearWholeDatabase = function(){
            var deferred = $q.defer();
            var promiseArray = [];            
            angular.forEach(Database.schema, function(collectionName) {
                promiseArray.push(indexeddbService.clear(collectionName, UserService.currentUser().objectId));
            });
            $q.all(promiseArray).then(deferred.resolve, deferred.reject);
            return deferred.promise;
        };
        

        dataService.getWholeDatabase = function() {
            var deferred = $q.defer();
            var promiseArray = [];
            angular.forEach(Database.schema, function(collectionName) {
                promiseArray.push(indexeddbService.getData(collectionName, UserService.currentUser().objectId));
            });
            $q.all(promiseArray).then(function resolve(result) {
                var allData = {};                
                for (var i = 0; i < result.length; i++) {
                    allData[Database.schema[i]] = result[i];
                }
                deferred.resolve(allData);
            }, deferred.reject);
            return deferred.promise;
        };


        dataService.save = function(collection, data, params) {
            return dataService.init().then(function(localData) {
                //save to indexedDB and to the cloud
                var resource = $injector.get(collection);
                var createdObject = angular.extend({}, data);
                return resource.save(data).$promise.then(function(result) {
                    createdObject[idField] = result[idField];
                    //save in local data
                    updateObjectInfos(createdObject, true);
                    if (localData && localData[collection]) {
                        localData[collection].push(createdObject);
                    }
                    return indexeddbService.addRecord(collection, createdObject).then(function(indexedDBResult) {
                        return createdObject;
                    });
                });
            });
        };

        dataService.update = function(collection, objectId, data, params) {
            return dataService.init().then(function(localData) {
                //save in local data
                var updatedObject = null;
                if (localData && localData[collection]) {
                    angular.forEach(localData[collection], function(record, index) {
                        if (record[idField] === objectId) {
                            updatedObject = angular.extend(localData[collection][index], data);
                            updateObjectInfos(updatedObject, false);
                            localData[collection][index] = updatedObject;
                        }
                    });
                }
                //save to indexedDB add to the cloud
                var resource = $injector.get(collection);

                return $q.all([
                    indexeddbService.addRecord(collection, updatedObject),
                    resource.update({'Id': objectId}, data).$promise
                ]).then(function(results) {
                    return results[1];
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


        dataService.delete = function(collection, objectId, params) {
            return dataService.init().then(function(localData) {
                //save in local data
                if (localData && localData[collection]) {
                    angular.forEach(localData[collection], function(record, index) {
                        if (record[idField] === objectId) {
                            localData[collection].splice(index, 1);
                        }
                    });
                }
                //save to indexedDB add to the cloud
                var resource = $injector.get(collection);
                var recordToDelete = {};
                recordToDelete[idField] = objectId;
                return $q.all([
                    indexeddbService.deleteRecord(collection, recordToDelete),
                    resource.delete({'Id': objectId}).$promise
                ]).then(function(results) {
                    return results[1];
                });
            });
        };

        dataService.queryLocal = function(collection, params) {
            return dataService.init().then(function(localData) {                
                return dataService.processResult(localData[collection], params);
            });
        };

        dataService.get = function(collection, objectId) {
            return dataService.init().then(function(localData) {
                return dataService.processResult(localData[collection], {where: {objectId: objectId}}).then(function(results) {
                    var result = null;
                    if (results && results.length === 1) {
                        result = results[0];
                    }
                    return result;
                });
            });
        };


        dataService.query = function(resourceObject, params) {
            var deferred = $q.defer();
            if (resourceObject && resourceObject.query) {
                //do parse query
                queryParse(resourceObject, params).then(function(queryResult) {
                    //process result
                    deferred.resolve(dataService.processResult(queryResult, params));
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

        dataService.queryParse = function(collection, resourceCount, params) {
            var queryPromise = null;
            var resourceObject = $injector.get(collection);
            if (resourceCount <= maxResult) {
                queryPromise = doParseQuery(resourceObject, params);
            } else {                
                var requestArray = [];
                var requestNumber = Math.floor(resourceCount / maxResult);
                var lastRequestCount = resourceCount % maxResult;
                if (lastRequestCount > 0) {
                    requestNumber++;
                }
                for (var requestIndex = 0; requestIndex < requestNumber; requestIndex++) {
                    var requestParams = angular.extend({}, params);
                    requestParams.limit = maxResult;
                    requestParams.skip = requestIndex * maxResult;
                    var request = doParseQuery(resourceObject, params);
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
        };



        dataService.processResult = function(queryResult, params) {
            var processedResult = queryResult;
            processedResult = [];
            angular.forEach(queryResult, function(row) {
                if (applyWhere(row, params)) {
                    var selectedRow = applySelect(row, params);
                    if (params && params.groupBy || containsOnlyAggregates(params)) {
                        applyGroupBy(processedResult, selectedRow, params);
                    } else {
                        processedResult.push(selectedRow);
                    }
                }
            });
            //TODO add having here            
            postProcess(processedResult, params);

            applyOrderBy(processedResult, params);

            return processedResult;
        };

        function containsOnlyAggregates(params) {
            var containsOnlyAggregates = true;
            if (params && params.select) {
                angular.forEach(params.select, function(queryElement) {
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
                angular.forEach(params.where, function(value, key) {
                    if (typeof value === 'object') {
                        angular.forEach(value, function(comparisonValue, operator) {
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
                angular.forEach(params.select, function(selectElement) {
                    if ((selectElement.field && typeof (row[selectElement.field]) !== 'undefined') || selectElement.field.indexOf('.') !== -1) {
                        var value = row[selectElement.field];
                        if (selectElement.field.indexOf('.') !== -1) {
                            value = row;
                            var splittedField = selectElement.field.split('.');
                            angular.forEach(splittedField, function(fieldPart) {
                                if (value[fieldPart] && typeof value[fieldPart] !== 'undefined') {
                                    value = value[fieldPart];
                                } else {
                                    value = '';
                                    return;
                                }
                            });
                        }
                        if (selectElement.transform) {
                            value = selectElement.transform(value, row, localData);
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
            angular.forEach(params.select, function(selectElement) {
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
            angular.forEach(params.select, function(selectElement) {
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
            if (params && params.having || avgFields.length > 0) {
                for (var indexOfRow = 0; indexOfRow < processedResult.length; indexOfRow++) {
                    angular.forEach(avgFields, function(selectElement) {
                        var alias = selectElement.field;
                        if (selectElement.alias) {
                            alias = selectElement.alias;
                        }
                        var existingValue = processedResult[indexOfRow][alias];
                        if (existingValue.count) {
                            processedResult[indexOfRow][alias] = existingValue.sum / existingValue.count;
                        } else {
                            processedResult[indexOfRow][alias] = '';
                        }

                    });
                }
            }
            return processedResult;
        }


        function applyOrderBy(processedResult, params) {
            var result = processedResult;
            if (params && params.orderBy && Array.isArray(params.orderBy) && params.orderBy.length > 0)
                processedResult.sort(function(rowA, rowB) {
                    var sortResult = 0;
                    for (var i = 0; i < params.orderBy.length; i++) {
                        var orderClause = params.orderBy[i];
                        var sortValueA = rowA[orderClause.alias];
                        var sortValueB = rowB[orderClause.alias];
                        if (orderClause.sort) {
                            sortResult = orderClause.sort(sortValueA, sortValueB);
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
                angular.forEach(params.select, function(selectElement) {
                    if (selectElement.aggregate && selectElement.aggregate === 'avg') {
                        avgFields.push(selectElement);
                    }
                });
            }
            return avgFields;
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
                    angular.forEach(groupBy, function(groupByField) {
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


        dataService.orderBy = function(data, orderBy) {
            var params = {};
            params.orderBy = orderBy;
            return applyOrderBy(data, params);
        };

        dataService.select = {
            //Year
            year: function(value, row) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = value.getFullYear();
                }
                return returnValue;
            },
            //MonthName
            monthName: function(value, row) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = this.$filter('date')(value, 'MMMM');
                }
                return returnValue;
            }.bind({$filter: $filter}),
            //Month
            month: function(value, row) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = value.getMonth() + 1;
                }
                return returnValue;
            },
            //weekDay
            weekDay: function(value, row) {
                var returnValue = "";
                if (value && value.getFullYear) {
                    returnValue = this.$filter('date')(value, 'EEEE');
                }
                return returnValue;
            }.bind({$filter: $filter}),
            //getBloodGlucose
            getBloodGlucose: function(value, row) {
                var returnValue = null;
                if (row.code && row.code === 1) {
                    returnValue = value;
                }
                return returnValue;
            }.bind({$injector: $injector}),
            //get weight
            getWeight: function(value, row) {
                var returnValue = null;
                if (row.code && row.code === 3) {
                    returnValue = value;
                }
                return returnValue;
            },
            getAnalysisPeriod: function(dateTime, row, localData) {
                var returnValue = '';
                var periods = localData.Period;
                angular.forEach(periods, function(period) {
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
            getBloodGlucoseRange: function(reading, row, localData) {
                var ranges = localData.Range;
                var convertedReading = reading * row.unit.coefficient;
                var returnValue = '';
                angular.forEach(ranges, function(range) {
                    if (convertedReading >= range.lowerLimit * range.unit.coefficient && convertedReading < range.upperLimit * range.unit.coefficient) {
                        returnValue = " >= " + range.lowerLimit + " < " + range.upperLimit;
                        return;
                    }
                });
                return returnValue;
            }

        };

        dataService.where = {
            currentYear: {
                title: 'Année en cours',
                function: function() {
                    var date = new Date();
                    var beginDate = new Date(date.getFullYear(), 0, 1);
                    var endDate = new Date(date.getFullYear() + 1, 0, 0);
                    return {$gt: beginDate, $lt: endDate};
                }
            },
            currentMonth: {
                title: 'Mois en cours',
                function: function() {
                    var date = new Date();
                    var beginDate = new Date(date.getFullYear(), date.getMonth());
                    var endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    return {$gt: beginDate, $lt: endDate};
                }
            }
        };


        dataService.sort = {
            monthName: function(a, b) {
                var datetime = this.$locale.DATETIME_FORMATS;
                var months = datetime.MONTH;
                var indexOfA = months.indexOf(a);
                var indexOfB = months.indexOf(b);
                return indexOfA - indexOfB;
            }.bind({$locale: $locale})
        };



        return dataService;
    }]);


