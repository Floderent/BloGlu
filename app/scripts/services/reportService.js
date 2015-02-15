'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('reportService', ['$q', 'ModelUtil', 'dataService', 'queryService', 'genericDaoService', 'unitService', 'ResourceCode', function ($q, ModelUtil, dataService, queryService, genericDaoService, unitService, ResourceCode) {

        var reportService = {};

        var reportResourceName = 'Report';

        reportService.getDashboards = function () {
            return genericDaoService.getAll('Dashboard');
        };
        reportService.getReports = function () {
            return genericDaoService.getAll(reportResourceName);
        };
        reportService.saveReport = function (report, isEdit) {
            return genericDaoService.save(reportResourceName, report, isEdit);
        };
        reportService.getReport = function (reportId) {
            return genericDaoService.get(reportResourceName, reportId);
        };
        reportService.deleteReport = function (report) {
            return genericDaoService.delete(reportResourceName, report);
        };        

        reportService.indexOfElement = function (elementList, element) {
            var indexOfElement = -1;
            var index = 0;
            angular.forEach(elementList, function (currentElement) {
                if (currentElement.name === element.name) {
                    indexOfElement = index;
                    return;
                }
                index++;
            });
            return indexOfElement;
        };

        reportService.executeReport = function (report) {
            var deferred = $q.defer();
            if (report && report.select) {
                reportService.executeReportQuery(report).then(deferred.resolve, deferred.reject);
            } else {
                deferred.reject('Wrong report format: no query');
            }
            return deferred.promise;
        };


        reportService.getFullQuery = function (mdm, select, filters, orderBys) {
            var resultQuery = {};
            var selectElements = [];

            if (select) {
                var selectElements = [];
                var orderByElements = [];
                angular.forEach(select, function (selectElement) {
                    selectElements.push(getMDMElement(mdm, selectElement.name));
                });                
                if (orderBys && angular.isArray(orderBys)) {
                    angular.forEach(orderBys, function (orderElement) {
                        orderByElements.push(getMDMElement(mdm, orderElement.alias));
                    });
                }
                var select = [];
                var groupBy = [];
                var orderBy = [];
                var where = {};

                angular.forEach(selectElements, function (queryElement) {
                    computeSelectExpression(select, queryElement);
                    computeGroupByExpression(groupBy, queryElement);
                    computeWhereExpression(where, queryElement.filter);
                });

                for (var i = 0; i < orderByElements.length; i++) {                    
                    var queryElement = orderByElements[i];
                    var orderClauseElement = orderBys[i];
                    var orderElement = {};
                    orderElement.alias = queryElement.name;
                    orderElement.direction = orderClauseElement.direction;
                    if (queryElement.sort) {
                        orderElement.sort = queryElement.sort;
                    }
                }
                if (filters) {
                    computeWhereExpression(where, filters);
                }

                if (select.length > 0) {
                    resultQuery.select = select;
                }
                if (groupBy.length > 0) {
                    resultQuery.groupBy = groupBy;
                }
                if (orderBy.length > 0) {
                    resultQuery.orderBy = orderBy;
                }
                if (where) {
                    resultQuery.where = where;
                }
            }
            return {query: resultQuery, headers: selectElements};
        };


        reportService.executeReportQuery = function (report) {
            var deferred = $q.defer();
            if (report) {
                queryService.getMetadatamodel().then(function (mdm) {
                    var queryResult = reportService.getFullQuery(mdm, report.select, report.filter, report.sort);
                    deferred.resolve({
                        headers: queryResult.headers,
                        data: dataService.queryLocal('Event', queryResult.query),
                        units: reportService.getQueryElementsUnits(queryResult.headers)
                    });
                }, deferred.reject);
            } else {
                deferred.reject();
            }
            return deferred.promise;
        };

        reportService.getQueryElementUnit = function (queryElement) {
            var deferred = $q.defer();
            if (queryElement && queryElement.filter) {
                var filterObject = angular.fromJson(queryElement.filter);
                if (filterObject.code) {
                    unitService.getUnit(filterObject.code).then(deferred.resolve, deferred.reject);
                } else {
                    deferred.resolve(null);
                }
            } else {
                deferred.resolve(null);
            }
            return deferred.promise;
        };

        reportService.getQueryElementsUnits = function (queryElements) {
            var deferred = $q.defer();
            var resourceNames = [];
            var queryElementsNames = [];
            angular.forEach(queryElements, function (queryElement) {
                var resourceName = getQueryElementResourceName(queryElement);
                if (resourceName && resourceNames.indexOf(resourceName) === -1 && queryElement.aggregate && queryElement.aggregate !== 'count') {
                    resourceNames.push(resourceName);
                    queryElementsNames.push(queryElement.title);
                }
            });
            var resourcesUnitsPromises = [];
            angular.forEach(resourceNames, function (resourceName) {
                resourcesUnitsPromises.push(unitService.getUnit(ResourceCode[resourceName]));
            });
            var resourcesUnits = [];
            $q.all(resourcesUnitsPromises).then(function (results) {
                for (var index in results) {
                    resourcesUnits.push({
                        title: queryElementsNames[index],
                        resourceName: resourceNames[index],
                        unit: results[index]
                    });
                }
                deferred.resolve(resourcesUnits);
            }, deferred.reject);
            return deferred.promise;
        };


        function getQueryElementResourceName(queryElement) {
            var queryElementResourceName = null;
            if (queryElement && queryElement.filter) {
                var filterObject = angular.fromJson(queryElement.filter);
                if (filterObject.code) {
                    queryElementResourceName = ResourceCode[parseInt(filterObject.code)];
                }
            }
            return queryElementResourceName;
        }

        function computeSelectExpression(select, queryElement) {
            var fieldSelect = {};
            if (queryElement.field) {
                fieldSelect.field = queryElement.field;
                fieldSelect.alias = queryElement.name;
                fieldSelect.transform = dataService.select[queryElement.expression];
                fieldSelect.filter = queryElement.filter;
                if (queryElement.aggregate) {
                    fieldSelect.aggregate = queryElement.aggregate;
                }
            }
            select.push(fieldSelect);
        }

        function computeGroupByExpression(groupBy, queryElement) {
            if (queryElement.field && !queryElement.aggregate) {
                var alias = queryElement.field;
                if (queryElement.name) {
                    alias = queryElement.name;
                }
                groupBy.push(alias);
            }
        }

        function computeWhereExpression(where, additionalFilters) {
            if (additionalFilters) {
                if (angular.isArray(additionalFilters)) {
                    angular.forEach(additionalFilters, function (additionalFilter) {
                        computeWhereClause(where, additionalFilter);
                    });
                } else {
                    computeWhereClause(where, additionalFilters);
                }
            }
        }


        function computeWhereClause(where, additionalFilter) {
            if (additionalFilter) {
                var filterToHandle = angular.extend({}, angular.fromJson(additionalFilter));
                angular.forEach(filterToHandle, function (value, key) {
                    if (value && value.type && value.type === 'function') {
                        var selectedFilter = null;
                        angular.forEach(dataService.where, function (filter) {                            
                            if (filter.id === value.value) {
                                selectedFilter = filter;
                                filterToHandle[key] = filter.filterFunction(value.filterValue);
                                return;
                            }
                        });
                    }
                });
                ModelUtil.addClauseToFilter(where, filterToHandle);
            }
        }

        function getMDMElement(mdm, elementName) {
            var result = null;
            angular.forEach(mdm, function (mdmElement) {
                if (mdmElement.name === elementName) {
                    result = mdmElement;
                }
            });
            return result;
        }

        return reportService;
    }]);
