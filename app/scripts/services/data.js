'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('queryService', ['$q', 'dataService', 'ModelUtil', function($q, dataService, ModelUtil) {
        var queryService = {};        

        queryService.getMeasures = function() {
            var measures = [];
            return dataService.queryLocal('Metadatamodel').then(function(mdm) {
                mdm.forEach(function(mdmElement) {
                    if (mdmElement.aggregate) {
                        measures.push(mdmElement);
                    }
                });
                return measures;
            });
        };

        queryService.getLevels = function() {
            var levels = [];
            return dataService.queryLocal('Metadatamodel').then(function(mdm) {
                mdm.forEach(function(mdmElement) {
                    if (!mdmElement.aggregate) {
                        levels.push(mdmElement);
                    }
                });
                return levels;
            });
        };

        queryService.getFilters = function() {
            return dataService.where;
        };

        return queryService;
    }]);


servicesModule.factory('dataService', ['$q', '$filter', '$injector', 'indexeddbService', 'UserService', function($q, $filter, $injector, indexeddbService) {
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


        dataService.init = function(forceRefresh) {
            var deferred = $q.defer();
            if (localData === null || forceRefresh) {
                indexeddbService.getWholeDatabase().then(function(result) {
                    localData = result;
                    deferred.resolve(result);
                }, deferred.reject);
            } else {
                deferred.resolve(localData);
            }
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
                    localData[collection].forEach(function(record, index) {
                        if (record[idField] === objectId) {
                            updatedObject = angular.extend(localData[collection][index], data);
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

        dataService.delete = function(collection, objectId, params) {
            return dataService.init().then(function(localData) {
                //save in local data
                if (localData && localData[collection]) {
                    localData[collection].forEach(function(record, index) {
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

        dataService.processResult = function(queryResult, params) {            
            var processedResult = queryResult;
            processedResult = [];
            queryResult.forEach(function(row) {
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
            return processedResult;
        };

        function containsOnlyAggregates(params) {
            var containsOnlyAggregates = true;
            if (params && params.select) {
                params.select.forEach(function(queryElement) {
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
                params.select.forEach(function(selectElement) {
                    if ((selectElement.field && typeof (row[selectElement.field]) !== 'undefined') || selectElement.field.indexOf('.') !== -1) {
                        var value = row[selectElement.field];
                        if (selectElement.field.indexOf('.') !== -1) {
                            value = row;
                            var splittedField = selectElement.field.split('.');
                            splittedField.forEach(function(fieldPart) {
                                if (typeof value[fieldPart] !== 'undefined') {
                                    value = value[fieldPart];
                                }else{
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
            if (params && params.having || avgFields.length > 0) {
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
            if (params && params.select) {
                params.select.forEach(function(selectElement) {
                    if (selectElement.aggregate && selectElement.aggregate === 'avg') {
                        avgFields.push(selectElement);
                    }
                });
            }
            return avgFields;
        }


        function getIndexOfRowInResult(rows, currentRow, params) {
            var resultIndex = -1;
            if (containsOnlyAggregates(params)) {
                if (rows.length === 0) {
                    resultIndex = -1;
                } else {
                    resultIndex = 0;
                }
            } else {
                var groupBy = params.groupBy;
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
            }
            return resultIndex;
        }

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
            //getBloodGlucose
            getBloodGlucose: function(value, row) {
                var returnValue = 0;
                if (row.code && row.code === 1) {
                    returnValue = value;
                }
                return returnValue;
            }.bind({$injector: $injector}),
            getAnalysisPeriod: function(dateTime, row, localData) {
                var returnValue = '';
                var periods = localData.Period;
                periods.forEach(function(period) {
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



        return dataService;
    }]);


