'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('reportService', ['$q', 'ModelUtil', 'dataService', function($q, ModelUtil, dataService) {

        var reportService = {};

        reportService.getReports = function() {
            return dataService.queryLocal('Report');
        };
        
        
        reportService.saveReport = function(report, isEdit){            
            var savingPromise = null;
            if (isEdit) {
                savingPromise = dataService.update('Report', report.objectId, report);
            } else {
                savingPromise = dataService.save('Report', report);
            }
            return savingPromise;
        };
        
        reportService.deleteReport = function(report) {
            var reportId = null;
            if (report && report.objectId) {
                reportId = report.objectId;
            } else {
                reportId = report;
            }
            return dataService.delete('Report', reportId);
        };

        reportService.executeReport = function(report) {
            var deferred = $q.defer();
            if (report && report.query) {
                reportService.executeReportQuery(report.query).then(deferred.resolve, deferred.reject);
            } else {
                deferred.reject('Wrong report format: no query');
            }
            return deferred.promise;
        };

        reportService.getReport = function(objectId) {
            return dataService.queryLocal('Report', {where: {objectId: objectId}}).then(function(result) {
                var report = {};
                if (result && result.length === 1) {
                    report = result[0];
                }
                return report;
            });
        };


        reportService.getFullQuery = function(query) {
            var resultQuery = {};
            var deferred = $q.defer();
            if (query && query.select) {
                dataService.queryLocal('Metadatamodel').then(function(mdm) {
                    var selectElements = [];
                    var orderByElements = [];
                    angular.forEach(query.select, function(selectElementName) {
                        selectElements.push(getMDMElement(mdm, selectElementName));
                    });
                    if (query.orderBy && Array.isArray(query.orderBy)) {
                        angular.forEach(query.orderBy, function(orderElement) {
                            orderByElements.push(getMDMElement(mdm, orderElement.name));
                        });
                    }
                    var select = [];
                    var groupBy = [];
                    var orderBy = [];
                    var where = {};

                    angular.forEach(selectElements, function(queryElement) {
                        computeSelectExpression(select, queryElement);
                        computeGroupByExpression(groupBy, queryElement);
                        computeWhereExpression(where, queryElement.filter);
                    });

                    for (var i = 0; i < orderByElements.length; i++) {
                        var queryElement = orderByElements[i];
                        var orderClauseElement = query.orderBy[i];
                        var orderElement = {};
                        orderElement.alias = queryElement.name;
                        orderElement.direction = orderClauseElement.direction;
                        if (queryElement.sort) {
                            orderElement.sort = queryElement.sort;
                        }
                    }

                    if (query.where) {
                        computeWhereExpression(where, query.where);
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
                    deferred.resolve({query: resultQuery, headers: selectElements});
                });
            } else {
                deferred.reject("invalid query");
            }
            return deferred.promise;
        };


        reportService.executeReportQuery = function(query) {
            return reportService.getFullQuery(query).then(function(result) {
                return dataService.queryLocal('Event', result.query).then(function(queryResult) {
                    return {
                        headers: result.headers,
                        data: queryResult
                    };
                });
            });
        };


        function computeSelectExpression(select, queryElement) {
            var fieldSelect = {};
            if (queryElement.field) {
                fieldSelect.field = queryElement.field;
                fieldSelect.alias = queryElement.name;
                fieldSelect.transform = dataService.select[queryElement.expression];
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

        function computeWhereExpression(where, additionalFilter) {
            if (additionalFilter) {
                var filterToHandle = angular.extend({}, angular.fromJson(additionalFilter));
                angular.forEach(filterToHandle, function(value, key) {
                    if (value.type && value.type === 'function') {
                        filterToHandle[key] = dataService.where[value.value].function();
                    }
                });
                ModelUtil.addClauseToFilter(where, filterToHandle);
            }
        }


        function getMDMElement(mdm, elementName) {
            var result = null;
            angular.forEach(mdm, function(mdmElement) {
                if (mdmElement.name === elementName) {
                    result = mdmElement;
                }
            });
            return result;
        }

        return reportService;
    }]);
