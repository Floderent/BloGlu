'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('rangeService', ['$translate', 'genericDaoService', 'UserService', function ($translate, genericDaoService, UserService) {

        var resourceName = 'Range';
        var rangeService = {};
        
        
        rangeService.getDefaultUnit = function(){            
            return UserService.getDefaultUnit(resourceName);
        };
        
        rangeService.getRanges = function () {
            return genericDaoService.getAll(resourceName);
        };

        rangeService.saveRange = function (range, isEdit) {
            var objectToSave = {
                unit: range.unit,
                lowerLimit: range.lowerLimit,
                upperLimit: range.upperLimit,
                normal: range.normal,
                color: range.color
            };
            return genericDaoService.save(resourceName, objectToSave, isEdit);
        };

        rangeService.deleteRange = function (range) {
            return genericDaoService.delete(resourceName, range);
        };



        rangeService.processRanges = function (rangeArray, newRangeUnit) {
            var maxUpperLimit = 0;            
            angular.forEach(rangeArray, function(range) {
                if (range.upperLimit > maxUpperLimit) {
                    maxUpperLimit = range.upperLimit;
                }
            });
            var newRange = {
                unit: newRangeUnit,
                lowerLimit: maxUpperLimit,
                upperLimit: maxUpperLimit,
                normal: false,
                color: ''
            };
            return newRange;
        };

        rangeService.checkRanges = function (ranges, newRange) {
            var errorMessages = [];
            var rangeArray = ranges.slice();            
            if (newRange && newRange.lowerLimit && newRange.upperLimit) {
                rangeArray.push(newRange);
                if(newRange.lowerLimit > newRange.upperLimit){
                    errorMessages.push($translate.instant("range.errorValue"));
                }                
                if(newRange.normal && rangeService.isNormalDefined(ranges)){
                    errorMessages.push($translate.instant("range.errorNormalAlreadyDefined"));
                }                
            }
            if (rangeService.areRangesIntersecting(rangeArray)) {
                errorMessages.push($translate.instant("range.errorIntersection"));
            }
            return errorMessages;
        };
        
        
        rangeService.isNormalDefined = function(ranges){
            var isNormalRangeAlreadyDefined = false;
            for(var index in ranges){
                if(ranges[index].normal){
                    isNormalRangeAlreadyDefined = true;
                    break;
                }
            }
            return isNormalRangeAlreadyDefined;
        };
        
        rangeService.areRangesIntersecting = function(rangeArray){
            var areRangeIntersecting = false;
            if (rangeArray && Array.isArray(rangeArray)) {
                for (var index = 0; index < rangeArray.length; index++) {
                    var range = rangeArray[index];
                    for (var j = 0; j < rangeArray.length; j++) {
                        if (j !== index) {
                            var comparisonRange = rangeArray[j];
                            if (rangeService.areRangeIntersecting(range, comparisonRange)) {
                                areRangeIntersecting = true;
                                break;
                            }
                        }
                    }
                }
            }
            return areRangeIntersecting;
        };
        
        rangeService.areRangeIntersecting = function (range1, range2) {            
            var range1Begin = range1.lowerLimit * range1.unit.coefficient;
            var range1End = range1.upperLimit * range1.unit.coefficient;
            var range2Begin = range2.lowerLimit * range2.unit.coefficient;
            var range2End = range2.upperLimit * range2.unit.coefficient;
            return range1Begin > range2Begin && range1Begin < range2End ||
                    range1End > range2Begin && range1End < range2End;
        };



        return rangeService;
    }]);
