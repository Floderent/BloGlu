'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('ModelUtil', [function() {
        var ModelUtil = {};
        ModelUtil.addClauseToFilter = function(existingClause, additionnalClauses) {
            var whereClause = {};
            if (!existingClause && additionnalClauses) {
                existingClause = {};
            }
            if (typeof existingClause === 'string') {
                whereClause = angular.fromJson(existingClause);
            } else {
                whereClause = existingClause;
            }
            angular.extend(whereClause, transformConditionToParseFormat(existingClause, additionnalClauses));
            return whereClause;
        };

        function transformConditionToParseFormat(existingClause, additionnalClauses) {
            var parseCondition = {};
            angular.forEach(additionnalClauses, function(value, key) {
                var newValue = null;
                var existingValue = null;
                if (existingClause[key]) {
                    existingValue = existingClause[key];
                    if (Array.isArray(value) && Array.isArray(existingValue)) {
                        newValue = {$in: existingValue.concat(value)};
                    } else {
                        if(Array.isArray(value)){
                            value.push(existingValue);
                            newValue = {$in: value};
                        }else{
                            if(Array.isArray(existingValue)){
                                existingValue.push(value);
                                newValue = {$in: existingValue};
                            }else{
                                newValue = {$in: [existingValue, value]};
                            }
                        }
                    }
                } else {
                    if (Array.isArray(value)) {
                        newValue = {$in: value};
                    } else {
                        newValue = value;
                    }
                }
                parseCondition[key] = newValue;
            });
            return parseCondition;
        }
        return ModelUtil;

    }]);


servicesModule.factory('Unit', ['$resource', 'ServerService', function($resource, ServerService) {
        var url = ServerService.baseUrl + 'classes/Unit/:Id';
        return $resource(url,
                {Id: '@Id'},
        {
            query: {
                method: 'GET',
                headers: ServerService.headers,
                isArray: true,
                transformResponse: function(data) {
                    var jsonResponse = angular.fromJson(data);
                    if (jsonResponse && jsonResponse.results) {
                        jsonResponse = jsonResponse.results;
                    }
                    return jsonResponse;
                }
            }
        });
    }]);


servicesModule.factory('Report', ['$resource', 'ServerService', 'UserService', function($resource, ServerService, UserService) {
        var url = ServerService.baseUrl + 'classes/Report/:Id';
        return $resource(url,
                {Id: '@Id'},
        {
            query: {
                method: 'GET',
                headers: ServerService.headers,
                isArray: true,
                transformResponse: function(data) {
                    var jsonResponse = angular.fromJson(data);
                    if (jsonResponse && jsonResponse.results) {
                        jsonResponse = jsonResponse.results;
                    }
                    return jsonResponse;
                }
            },
            count: {
                method: 'GET',
                headers: UserService.headers()
            },
            save: {
                method: 'POST',
                headers: UserService.headers(),
                transformRequest: function(data) {
                    if (data) {
                        data.ACL = UserService.ownerReadWriteACL();
                    }
                    return angular.toJson(data);
                }
            },
            get: {
                method: 'GET',
                headers: UserService.headers()
            },
            update: {
                method: 'PUT',
                headers: UserService.headers(),
                transformRequest: function(data) {
                    if (data) {
                        data.ACL = UserService.ownerReadWriteACL();
                    }
                    return angular.toJson(data);
                }
            },
            delete: {
                method: 'DELETE',
                headers: UserService.headers()
            }
        });
    }]);


servicesModule.factory('Metadatamodel', ['$resource', 'ServerService', 'UserService', function($resource, ServerService, UserService) {
        var url = ServerService.baseUrl + 'classes/Metadatamodel/:Id';
        return $resource(url,
                {Id: '@Id'},
        {
            query: {
                method: 'GET',
                headers: ServerService.headers,
                isArray: true,
                transformResponse: function(data) {
                    var jsonResponse = angular.fromJson(data);
                    if (jsonResponse && jsonResponse.results) {
                        jsonResponse = jsonResponse.results;
                    }
                    return jsonResponse;
                }
            },
            count: {
                method: 'GET',
                headers: UserService.headers()
            },
            get: {
                method: 'GET',
                headers: UserService.headers()
            }
        });
    }]);

servicesModule.factory('Event', ['$resource', 'ServerService', 'UserService', 'dateUtil', function($resource, ServerService, UserService, dateUtil) {
        var url = ServerService.baseUrl + "classes/Event/:Id";
        return $resource(url, {
            include: 'unit'
        },
        {
            query: {
                method: 'GET',
                headers: UserService.headers(),
                isArray: true,
                transformResponse: function(data) {
                    var jsonResponse = angular.fromJson(data);
                    if (jsonResponse && jsonResponse.results) {
                        jsonResponse = jsonResponse.results;
                        jsonResponse = jsonResponse.map(function(element) {
                            if (element.dateTime) {
                                element.dateTime = dateUtil.convertToNormalFormat(element.dateTime);
                            }
                            return element;
                        });
                    }
                    return jsonResponse;
                }
            },
            count: {
                method: 'GET',
                headers: UserService.headers()
            },
            save: {
                method: 'POST',
                headers: UserService.headers(),
                transformRequest: function(data) {
                    if (data) {
                        data.ACL = UserService.ownerReadWriteACL();
                        if (data.dateTime) {
                            data.dateTime = dateUtil.convertToParseFormat(data.dateTime);
                        }
                        if (data.unit && data.unit.objectId) {
                            data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                        }
                        if (data.type && data.type.objectId) {
                            data.unit = {__type: 'Pointer', className: 'Type', objectId: data.type.objectId};
                        }
                    }
                    return angular.toJson(data);
                }
            },
            get: {
                method: 'GET',
                headers: UserService.headers(),
                transformResponse: function(data) {
                    var jsonResponse = angular.fromJson(data);
                    if (jsonResponse) {
                        if (jsonResponse.dateTime) {
                            jsonResponse.dateTime = dateUtil.convertToNormalFormat(jsonResponse.dateTime);
                        }
                    }
                    return jsonResponse;
                }
            },
            update: {
                method: 'PUT',
                headers: UserService.headers(),
                transformRequest: function(data) {
                    if (data) {
                        data.ACL = UserService.ownerReadWriteACL();
                        if (data.dateTime) {
                            data.dateTime = dateUtil.convertToParseFormat(data.dateTime);
                        }
                        if (data.unit && data.unit.objectId) {
                            data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                        }
                        if (data.type && data.type.objectId) {
                            data.unit = {__type: 'Pointer', className: 'Type', objectId: data.type.objectId};
                        }
                    }
                    return angular.toJson(data);
                }
            },
            delete: {
                method: 'DELETE',
                headers: UserService.headers()
            }
        });
    }]);


servicesModule.factory('Target', ['$resource', 'ServerService', 'UserService', function($resource, ServerService, UserService) {
        var url = ServerService.baseUrl + "classes/Target";
        return $resource(url, {
            include: 'unit'
        },
        {
            query: {
                method: "GET",
                headers: UserService.headers(),
                isArray: true,
                transformResponse: function(data) {
                    var jsonResponse = angular.fromJson(data);
                    if (jsonResponse && jsonResponse.results) {
                        jsonResponse = jsonResponse.results;
                    }
                    return jsonResponse;
                }
            },
            save: {
                method: "POST",
                headers: UserService.headers(),
                transformRequest: function(data) {
                    if (data) {
                        data.ACL = UserService.ownerReadWriteACL();
                    }
                    return angular.toJson(data);
                }
            },
            update: {
                method: "PUT",
                headers: UserService.headers(),
                transformRequest: function(data) {
                    if (data) {
                        data.ACL = UserService.ownerReadWrite();
                    }
                    return angular.toJson(data);
                }
            }
        });
    }]);

servicesModule.factory('Period', ['$resource', 'ServerService', 'UserService', 'dateUtil', function($resource, ServerService, UserService, dateUtil) {
        var url = ServerService.baseUrl + 'classes/Period/:Id';
        return $resource(url,
                {
                },
                {
                    query: {
                        method: 'GET',
                        headers: UserService.headers(),
                        isArray: true,
                        transformResponse: function(data) {
                            var jsonResponse = angular.fromJson(data);
                            if (jsonResponse && jsonResponse.results) {
                                jsonResponse = jsonResponse.results;
                                jsonResponse = jsonResponse.map(function(period) {
                                    period.begin = dateUtil.convertToNormalFormat(period.begin);
                                    period.end = dateUtil.convertToNormalFormat(period.end);
                                    return period;
                                });
                            }
                            return jsonResponse;
                        }
                    },
                    save: {
                        method: 'POST',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                var dataToSave = angular.extend({}, data);
                                dataToSave.ACL = UserService.ownerReadWriteACL();
                                if (dataToSave.begin && dataToSave.end) {
                                    dataToSave.begin = dateUtil.convertToParseFormat(dataToSave.begin);
                                    dataToSave.end = dateUtil.convertToParseFormat(dataToSave.end);
                                }
                            }
                            return angular.toJson(dataToSave);
                        }
                    },
                    update: {
                        method: 'PUT',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                                if (data.begin && data.end) {
                                    data.begin = dateUtil.convertToParseFormat(data.begin);
                                    data.end = dateUtil.convertToParseFormat(data.end);
                                }
                            }
                            return angular.toJson(data);
                        }
                    },
                    delete: {
                        method: 'DELETE',
                        headers: UserService.headers()
                    }
                });
    }]);


servicesModule.factory('User', ['$resource', 'ServerService', 'UserService', function($resource, ServerService, UserService) {
        var url = ServerService.baseUrl + "users/:userId";
        return $resource(url,
                {},
                {
                    update: {
                        method: "PUT",
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                                if (data.sessionToken) {
                                    delete data.sessionToken;
                                }
                            }
                            return angular.toJson(data);
                        }
                    }
                });

    }]);

servicesModule.factory('UserPreferences', ['$resource', 'ServerService', 'UserService', function($resource, ServerService, UserService) {
        var url = ServerService.baseUrl + 'classes/UserPreferences';
        return $resource(url, {},
                {
                    query: {
                        method: 'GET',
                        headers: UserService.headers(),
                        isArray: true,
                        transformResponse: function(data) {
                            var jsonResponse = angular.fromJson(data);
                            if (jsonResponse && jsonResponse.results) {
                                jsonResponse = jsonResponse.results;
                            }
                            return jsonResponse;
                        }
                    },
                    save: {
                        method: 'POST',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWriteACL();
                            }
                            return angular.toJson(data);
                        }
                    },
                    update: {
                        method: 'PUT',
                        headers: UserService.headers(),
                        transformRequest: function(data) {
                            if (data) {
                                data.ACL = UserService.ownerReadWrite();
                            }
                            return angular.toJson(data);
                        }
                    }

                });
    }]);