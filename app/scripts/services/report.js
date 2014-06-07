'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('reportService', ['$q', 'ModelUtil', 'dataService', 'queryService', function($q, ModelUtil, dataService, queryService) {

        var reportService = {};


        reportService.executeReport = function(report) {
            var deferred = $q.defer();
            if (report && report.query) {
                reportService.executeReportQuery(report.query).then(deferred.resolve, deferred.reject);
            } else {
                deferred.reject('Wrong report format: no query');
            }
            return deferred.promise;
        };


        reportService.executeReportQuery = function(query) {
            var deferred = $q.defer();
            var resultQuery = {};
            if (query && query.select) {
                dataService.queryLocal('Metadatamodel').then(function(mdm) {                    
                    var selectElements = [];
                    var orderByElements = [];
                    query.select.forEach(function(selectElementName) {
                        selectElements.push(getMDMElement(mdm, selectElementName));
                    });
                    if (query.orderBy && Array.isArray(query.orderBy)) {
                        query.orderBy.forEach(function(orderElement) {
                            orderByElements.push(getMDMElement(mdm, orderElement.name));
                        });
                    }

                    var select = [];
                    var groupBy = [];
                    var orderBy = [];
                    var where = {};

                    selectElements.forEach(function(queryElement) {
                        computeSelectExpression(select, queryElement);
                        computeGroupByExpression(groupBy, queryElement);
                        computeWhereExpression(where, queryElement.filter);
                    });
                    
                    for(var i = 0; i < orderByElements.length; i++){
                        var queryElement = orderByElements[i];
                        var orderClauseElement = query.orderBy[i];                        
                        var orderElement = {};
                        orderElement.alias = queryElement.name;
                        orderElement.direction = orderClauseElement.direction;
                        if(queryElement.sort){
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
                    if(orderBy.length > 0){
                        resultQuery.orderBy = orderBy;
                    }
                    if (where) {
                        resultQuery.where = where;
                    }
                    
                    dataService.queryLocal('Event', resultQuery).then(function(queryResult) {
                        deferred.resolve({
                            headers: selectElements,
                            data: queryResult
                        });
                    }, deferred.reject);
                });

            } else {
                deferred.resolve(resultQuery);
            }
            return deferred.promise;
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
            mdm.forEach(function(mdmElement) {
                if (mdmElement.name === elementName) {
                    result = mdmElement;
                }
            });
            return result;
        }




        return reportService;
    }]);
