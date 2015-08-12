(function () {
'use strict';

angular.module('bloglu.utils')
            .factory('Utils', Utils);


Utils.$inject = ['$modal', '$rootScope', '$translate', 'ResourceName', 'UserSessionService'];

function Utils($modal, $rootScope, $translate, ResourceName, UserSessionService) {
        var Utils = {};
        Utils.guid = (function () {
            function s4() {
                return Math.floor((1 + Math.random()) * 0x10000)
                        .toString(16)
                        .substring(1);
            }
            return function () {
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                        s4() + '-' + s4() + s4() + s4();
            };
        })();


        Utils.openConfirmModal = function (scopeOptions, modalOptions) {
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
        };


        Utils.getConnectedUser = function (localData) {
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
        };

        Utils.getReferenceUnit = function (localData, resourceCode) {
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
        };


        Utils.getDefaultUnit = function (localData, resourceCode) {
            var defaultUnit = null;
            var connectedUser = Utils.getConnectedUser(localData);
            if (connectedUser.preferences && connectedUser.preferences.defaultUnits && connectedUser.preferences.defaultUnits[ResourceName[parseInt(resourceCode)]]) {
                defaultUnit = connectedUser.preferences.defaultUnits[ResourceName[parseInt(resourceCode)]];
            } else {
                defaultUnit = Utils.getReferenceUnit(localData, resourceCode);
            }
            return defaultUnit;
        };

        Utils.getConvertedReading = function (value, row, localData, resourceCode) {
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
        };
        return Utils;
    }



})();
