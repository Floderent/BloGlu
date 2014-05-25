'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('reportService', ['$q', 'ModelUtil', 'dataService', 'queryService', function($q, ModelUtil, dataService, queryService) {

        var reportService = {};
 
        
        reportService.executeReport = function(report){
            var deferred = $q.defer();
            if(report && report.query){
                reportService.executeReportQuery(report.query).then(deferred.resolve, deferred.reject);
            }else{
                deferred.reject('Wrong report format: no query');
            }            
            return deferred.promise;
        };
        

        reportService.executeReportQuery = function(query) {
            var deferred = $q.defer();
            var resultQuery = {};        
            if (query && query.select) {
                var selectElementsPromiseArray = [];
                query.select.forEach(function(selectElementName) {
                    selectElementsPromiseArray.push(getMDMElement(selectElementName));
                });
                $q.all(selectElementsPromiseArray).then(function(mdmSelectElements) {
                    var select = [];
                    var groupBy = [];
                    var where = {};
                    mdmSelectElements.forEach(function(queryElement) {
                        computeSelectExpression(select, queryElement);
                        computeGroupByExpression(groupBy, queryElement);
                        computeWhereExpression(where, queryElement.filter);
                    });
                    if (query.where) {
                        computeWhereExpression(where, query.where);
                    }

                    if (select.length > 0) {
                        resultQuery.select = select;
                    }
                    if (groupBy.length > 0) {
                        resultQuery.groupBy = groupBy;
                    }
                    if (where) {
                        resultQuery.where = where;
                    }
                    dataService.queryLocal('Event', resultQuery).then(function(queryResult) {
                        deferred.resolve({
                            headers: mdmSelectElements,
                            data: queryResult
                        });
                    }, deferred.reject);
                }, deferred.reject);
            } else {
                deferred.resolve(resultQuery);
            }
            return deferred.promise;
        };


        function computeSelectExpression(select, queryElement) {
            var fieldSelect = {};
            if (queryElement.field) {
                fieldSelect.field = queryElement.field;
                fieldSelect.alias = queryElement.title;
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
                if (queryElement.title) {
                    alias = queryElement.title;
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

        function getMDMElement(elementName) {
            return dataService.queryLocal('Metadatamodel').then(function(mdm) {
                var result = null;
                mdm.forEach(function(mdmElement) {
                    if (mdmElement.name === elementName) {
                        result = mdmElement;
                    }
                });
                return result;
            });
        }




        return reportService;
    }]);
