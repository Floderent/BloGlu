(function () {
    'use strict';
    
    angular.module('bloglu.utils')
            .factory('Utils', Utils);

    Utils.$inject = ['$modal', '$rootScope', '$translate', 'ResourceName', 'UserSessionService'];

    function Utils($modal, $rootScope, $translate, ResourceName, UserSessionService) {
        var Utils = {
            openConfirmModal: openConfirmModal,
            getConnectedUser: getConnectedUser,
            getReferenceUnit: getReferenceUnit,
            getDefaultUnit: getDefaultUnit,
            getConvertedReading: getConvertedReading,
            equals: equals
        };
        return Utils;

        function openConfirmModal(scopeOptions, modalOptions) {
            var modalScope = $rootScope.$new();
            modalScope = angular.extend(modalScope, scopeOptions);
            if (scopeOptions) {
                angular.forEach(scopeOptions, function (value, key) {
                    if (typeof value === 'object') {
                        if (value.id && value.params) {
                            modalScope[key] = $translate.instant(value.id, value.params);
                        }
                    } else {
                        modalScope[key] = $translate.instant(value);
                    }
                });
            }
            var defaultModalOptions = {
                templateUrl: "app/shared/confirmModal/templates/confirm.html",
                controller: "confirmModalController as vm",
                scope: modalScope
            };
            var defaultModalOptions = angular.extend(defaultModalOptions, modalOptions);
            return $modal.open(defaultModalOptions).result;
        }


        function getConnectedUser(localData) {
            var currentUserId = UserSessionService.getUserId();
            var connectedUser = null;
            if (localData && localData.User) {
                angular.forEach(localData.User, function (user) {
                    if (user.objectId === currentUserId) {
                        connectedUser = user;
                        return;
                    }
                });
            }
            return connectedUser;
        }

        function getReferenceUnit(localData, resourceCode) {
            var referenceUnit = null;
            if (localData && localData.Unit) {
                angular.forEach(localData.Unit, function (unit) {
                    if (unit.code === resourceCode && unit.coefficient === 1) {
                        referenceUnit = unit;
                        return;
                    }
                });
            }
            return referenceUnit;
        }


        function getDefaultUnit(localData, resourceCode) {
            var defaultUnit = null;
            var connectedUser = Utils.getConnectedUser(localData);
            if (connectedUser.preferences && connectedUser.preferences.defaultUnits && connectedUser.preferences.defaultUnits[ResourceName[parseInt(resourceCode)]]) {
                defaultUnit = connectedUser.preferences.defaultUnits[ResourceName[parseInt(resourceCode)]];
            } else {
                defaultUnit = Utils.getReferenceUnit(localData, resourceCode);
            }
            return defaultUnit;
        }

        function getConvertedReading(value, row, localData, resourceCode) {
            var returnValue = null;
            if (row.code && row.code === resourceCode) {
                returnValue = value;
                if (Utils.getDefaultUnit(localData, resourceCode) && Utils.getDefaultUnit(localData, resourceCode).coefficient) {
                    returnValue = returnValue * Utils.getDefaultUnit(localData, 1).coefficient;
                } else {
                    returnValue = returnValue * row.unit.coefficient;
                }
            }
            return returnValue;
        }
        
        function equals(object1, object2, propertiesToCheck){
            var areEquals = true;
            if(!object1 && object2 || object1 && !object2){
                areEquals = false;
            }else{
                angular.forEach(propertiesToCheck, function(property){
                if(object1[property] !== object2[property]){
                    areEquals = false;
                    return;
                }
            });
            }            
            return areEquals;
        }        

    }

})();
