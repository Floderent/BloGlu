(function () {
    'use strict';

    angular.module('bloglu.range')
            .factory('rangeService', rangeService);

    rangeService.$inject = ['$translate', 'genericDaoService', 'UserService'];

    function rangeService($translate, genericDaoService, UserService) {

        var resourceName = 'Range';
        var rangeService = {
            getDefaultUnit: getDefaultUnit,
            getRanges: getRanges,
            saveRange: saveRange,
            deleteRange: deleteRange,
            processRanges: processRanges,
            checkRanges: checkRanges,
            isNormalDefined: isNormalDefined,
            areRangesIntersecting: areRangesIntersecting,
            areRangeIntersecting: areRangeIntersecting
        };
        return rangeService;

        function getDefaultUnit() {
            return UserService.getDefaultUnit(resourceName);
        }

        function getRanges() {
            return genericDaoService.getAll(resourceName).then(function(ranges){
                return ranges.sort(function(range1, range2){
                    return range1.lowerLimit > range2.lowerLimit;
                });
            });
        }

        function saveRange(range, isEdit) {            
            var objectToSave = {
                unit: range.unit,
                lowerLimit: range.lowerLimit,
                upperLimit: range.upperLimit,
                normal: range.normal,
                color: range.color
            };
            if(isEdit){
                objectToSave.objectId = range.objectId;
                objectToSave.userId = range.userId;
            }
            return genericDaoService.save(resourceName, objectToSave, isEdit);
        }

        function deleteRange(range) {
            return genericDaoService.remove(resourceName, range);
        }

        function processRanges(rangeArray, newRangeUnit) {
            var maxUpperLimit = 0;
            angular.forEach(rangeArray, function (range) {
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
        }

        function checkRanges(ranges, newRange) {
            var errorMessages = [];
            var rangeArray = ranges.slice();
            if (newRange && newRange.lowerLimit && newRange.upperLimit) {
                rangeArray.push(newRange);
                if (newRange.lowerLimit > newRange.upperLimit) {
                    errorMessages.push($translate.instant("range.errorValue"));
                }
                if (newRange.normal && rangeService.isNormalDefined(ranges)) {
                    errorMessages.push($translate.instant("range.errorNormalAlreadyDefined"));
                }
            }
            if (rangeService.areRangesIntersecting(rangeArray)) {
                errorMessages.push($translate.instant("range.errorIntersection"));
            }
            return errorMessages;
        }


        function isNormalDefined(ranges) {
            var isNormalRangeAlreadyDefined = false;
            for (var index in ranges) {
                if (ranges[index].normal) {
                    isNormalRangeAlreadyDefined = true;
                    break;
                }
            }
            return isNormalRangeAlreadyDefined;
        }

        function areRangesIntersecting(rangeArray) {
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
        }

        function areRangeIntersecting(range1, range2) {
            var range1Begin = range1.lowerLimit * range1.unit.coefficient;
            var range1End = range1.upperLimit * range1.unit.coefficient;
            var range2Begin = range2.lowerLimit * range2.unit.coefficient;
            var range2End = range2.upperLimit * range2.unit.coefficient;
            return range1Begin > range2Begin && range1Begin < range2End ||
                    range1End > range2Begin && range1End < range2End;
        }



        
    }
})();
