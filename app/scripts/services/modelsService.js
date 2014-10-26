'use strict';

var servicesModule = angular.module('BloGlu.services');


servicesModule.factory('ModelUtil', ['dateUtil', 'UserService', function (dateUtil, UserService) {
        var ModelUtil = {};
        ModelUtil.addClauseToFilter = function (existingClause, additionnalClauses) {
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

        ModelUtil.genericTransformRequest = function (data) {
            if (data) {
                data.ACL = UserService.ownerReadWriteACL();
            }
            return angular.toJson(data);
        };

        ModelUtil.genericTransformResponse = function (data) {
            var jsonResponse = angular.fromJson(data);
            if (jsonResponse && jsonResponse.results) {
                jsonResponse = jsonResponse.results;
            }
            return jsonResponse;
        };


        function transformConditionToParseFormat(existingClause, additionnalClauses) {
            var parseCondition = {};
            angular.forEach(additionnalClauses, function (value, key) {
                var newValue = null;
                var existingValue = null;
                if (existingClause[key]) {
                    existingValue = existingClause[key];
                    if (Array.isArray(value) && Array.isArray(existingValue)) {
                        newValue = {$in: existingValue.concat(value)};
                    } else {
                        if (Array.isArray(value)) {
                            value.push(existingValue);
                            newValue = {$in: value};
                        } else {
                            if (Array.isArray(existingValue)) {
                                existingValue.push(value);
                                newValue = {$in: existingValue};
                            } else {
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
        /*
         * params format = [{field:"beginDate",type:"date"},{field:"unit", type: "pointer", className:"Unit"}]
         * 
         */
        ModelUtil.transformToParseFormat = function (data, params, ACL) {
            return changeDataFormat(data, params, ACL);
        };

        ModelUtil.transformToNormalFormat = function (data, params, ACL) {
            return changeDataFormat(data, params, ACL, true);
        };


        function changeDataFormat(data, params, ACL, convertToNormalFormat) {
            if (data) {
                if (ACL) {
                    data.ACL = ACL;
                }
                if (params && Array.isArray(params) && params.length > 0) {
                    for (var i in params) {
                        var clause = params[i];
                        if (clause.field && clause.type && data[clause.field]) {
                            switch (clause.type) {
                                case 'date':
                                    if (convertToNormalFormat) {
                                        data[clause.field] = dateUtil.convertToNormalFormat(data[clause.field]);
                                    } else {
                                        data[clause.field] = dateUtil.convertToParseFormat(data[clause.field]);
                                    }
                                    break;
                                case 'pointer':
                                    if (clause.className && data[clause.field].objectId) {
                                        data[clause.field] = {__type: 'Pointer', className: clause.className, objectId: data[clause.field].objectId};
                                    }
                                    break;
                                case 'file':
                                    if (convertToNormalFormat) {
                                        data[clause.field] = data[clause.field].name;
                                    } else {
                                        data[clause.field] = {__type: 'File', name: data[clause.field]};
                                    }
                                    break;
                            }
                        }
                    }
                }
            }
            return data;
        }
        return ModelUtil;

    }]);


servicesModule.factory('Unit', ['$resource', 'ServerService', 'ModelUtil', function ($resource, ServerService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Unit/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || ServerService.headers,
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                }
            });
        };
    }]);


servicesModule.factory('Report', ['$resource', 'ServerService', 'UserService', 'ModelUtil', function ($resource, ServerService, UserService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Report/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                count: {
                    method: 'GET',
                    headers: headers || UserService.headers()
                },
                save: {
                    method: 'POST',
                    headers: headers || UserService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                get: {
                    method: 'GET',
                    headers: headers || UserService.headers()
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserService.headers()
                }
            });
        };
    }]);


servicesModule.factory('Import', ['$resource', 'ServerService', 'UserService', 'ModelUtil', function ($resource, ServerService, UserService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Import/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserService.headers(),
                    isArray: true,
                    transformResponse: function (data) {
                        var jsonResponse = angular.fromJson(data);
                        if (jsonResponse && jsonResponse.results) {
                            jsonResponse = jsonResponse.results;
                            jsonResponse = jsonResponse.map(function (element) {
                                return ModelUtil.transformToNormalFormat(element, [{field: 'beginDate', type: 'date'}, {field: 'endDate', type: 'date'}, {field: 'dateTime', type: 'date'}, {field: 'file', type: 'file'}]);
                            });
                        }
                        return jsonResponse;
                    }
                },
                count: {
                    method: 'GET',
                    headers: headers || UserService.headers()
                },
                save: {
                    method: 'POST',
                    headers: headers || UserService.headers(),
                    transformRequest: function (data) {
                        data = ModelUtil.transformToParseFormat(data, [{field: 'beginDate', type: 'date'}, {field: 'endDate', type: 'date'}, {field: 'dateTime', type: 'date'}, {field: 'bgUnit', type: 'pointer', className: 'Unit'}, {field: 'file', type: 'file'}], UserService.ownerReadWriteACL());
                        return angular.toJson(data);
                    }
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserService.headers(),
                    transformRequest: function (data) {
                        data = ModelUtil.transformToParseFormat(data, [{field: 'beginDate', type: 'date'}, {field: 'endDate', type: 'date'}, {field: 'dateTime', type: 'date'}, {field: 'bgUnit', type: 'pointer', className: 'Unit'}, {field: 'file', type: 'file'}], UserService.ownerReadWriteACL());
                        return angular.toJson(data);
                    }
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserService.headers()
                }
            });
        };
    }]);



servicesModule.factory('Dashboard', ['$resource', 'ServerService', 'UserService', 'ModelUtil', function ($resource, ServerService, UserService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Dashboard/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                count: {
                    method: 'GET',
                    headers: headers || UserService.headers()
                },
                save: {
                    method: 'POST',
                    headers: headers || UserService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                get: {
                    method: 'GET',
                    headers: headers || UserService.headers()
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserService.headers()
                }
            });
        };
    }]);



servicesModule.factory('Metadatamodel', ['$resource', 'ServerService', 'UserService', 'ModelUtil', function ($resource, ServerService, UserService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Metadatamodel/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                count: {
                    method: 'GET',
                    headers: headers || UserService.headers()
                },
                get: {
                    method: 'GET',
                    headers: headers || UserService.headers()
                }
            });
        };
    }]);


servicesModule.factory('Batch', ['$resource', 'ServerService', 'UserService', 'dateUtil', function ($resource, ServerService, UserService, dateUtil) {
        var url = ServerService.baseUrl + 'batch';

        return function (headers) {
            return $resource(url,
                    {},
                    {
                        batchEvent: {
                            method: 'POST',
                            headers: headers || UserService.headers(),
                            isArray: true,
                            transformRequest: function (data) {
                                var dataToSend = [];
                                angular.forEach(data, function (event) {
                                    var postEvent = {};
                                    if (event) {
                                        event.ACL = UserService.ownerReadWriteACL();
                                        if (event.dateTime) {
                                            event.dateTime = dateUtil.convertToParseFormat(event.dateTime);
                                        }
                                        if (event.unit && event.unit.objectId) {
                                            event.unit = {__type: 'Pointer', className: 'Unit', objectId: event.unit.objectId};
                                        }
                                        if (event.category && event.category.objectId) {
                                            event.category = {__type: 'Pointer', className: 'Category', objectId: event.category.objectId};
                                        }
                                    }
                                    postEvent.method = 'POST';
                                    postEvent.path = '/1/classes/Event';
                                    postEvent.body = event;
                                    dataToSend.push(postEvent);
                                });
                                return angular.toJson({requests: dataToSend});
                            }
                        }
                    });
        };
    }]);


servicesModule.factory('Event', ['$resource', 'ServerService', 'UserService', 'dateUtil', function ($resource, ServerService, UserService, dateUtil) {
        var url = ServerService.baseUrl + "classes/Event/:Id";

        return function (headers) {
            return $resource(url, {
                include: 'unit,category'
            },
            {
                query: {
                    method: 'GET',
                    cache: false,
                    headers: headers || UserService.headers(),
                    isArray: true,
                    transformResponse: function (data) {
                        var jsonResponse = angular.fromJson(data);
                        if (jsonResponse && jsonResponse.results) {
                            jsonResponse = jsonResponse.results;
                            jsonResponse = jsonResponse.map(function (element) {
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
                    headers: headers || UserService.headers()
                },
                save: {
                    method: 'POST',
                    headers: headers || UserService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            data.ACL = UserService.ownerReadWriteACL();
                            if (data.dateTime) {
                                data.dateTime = dateUtil.convertToParseFormat(data.dateTime);
                            }
                            if (data.unit && data.unit.objectId) {
                                data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                            }
                            if (data.category && data.category.objectId) {
                                data.category = {__type: 'Pointer', className: 'Category', objectId: data.category.objectId};
                            }
                        }
                        return angular.toJson(data);
                    }
                },
                get: {
                    method: 'GET',
                    headers: headers || UserService.headers(),
                    transformResponse: function (data) {
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
                    headers: headers || UserService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            data.ACL = UserService.ownerReadWriteACL();
                            if (data.dateTime) {
                                data.dateTime = dateUtil.convertToParseFormat(data.dateTime);
                            }
                            if (data.unit && data.unit.objectId) {
                                data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                            }
                            if (data.category && data.category.objectId) {
                                data.category = {__type: 'Pointer', className: 'Category', objectId: data.category.objectId};
                            }
                        }
                        return angular.toJson(data);
                    }
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserService.headers()
                }
            });
        };

    }]);


servicesModule.factory('Period', ['$resource', 'ServerService', 'UserService', 'dateUtil', function ($resource, ServerService, UserService, dateUtil) {
        var url = ServerService.baseUrl + 'classes/Period/:Id';
        return function (headers) {
            return $resource(url,
                    {
                    },
                    {
                        query: {
                            method: 'GET',
                            headers: headers || UserService.headers(),
                            isArray: true,
                            transformResponse: function (data) {
                                var jsonResponse = angular.fromJson(data);
                                if (jsonResponse && jsonResponse.results) {
                                    jsonResponse = jsonResponse.results;
                                    jsonResponse = jsonResponse.map(function (period) {
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
                            headers: headers || UserService.headers(),
                            transformRequest: function (data) {
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
                            headers: headers || UserService.headers(),
                            transformRequest: function (data) {
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
                            headers: headers || UserService.headers()
                        }
                    });
        };
    }]);


servicesModule.factory('Category', ['$resource', 'ServerService', 'UserService', 'ModelUtil', function ($resource, ServerService, UserService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Category/:Id';
        return function (headers) {
            return $resource(url,
                    {
                    },
                    {
                        query: {
                            method: 'GET',
                            headers: headers || UserService.headers(),
                            isArray: true,
                            transformResponse: ModelUtil.genericTransformResponse
                        },
                        save: {
                            method: 'POST',
                            headers: headers || UserService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        },
                        update: {
                            method: 'PUT',
                            headers: headers || UserService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        },
                        delete: {
                            method: 'DELETE',
                            headers: headers || UserService.headers()
                        }
                    });
        };
    }]);


servicesModule.factory('User', ['$resource', 'ServerService', 'UserService', function ($resource, ServerService, UserService) {
        var url = ServerService.baseUrl + "users/:userId";
        return function (headers) {
            return $resource(url,
                    {},
                    {
                        update: {
                            method: "PUT",
                            headers: headers || UserService.headers(),
                            transformRequest: function (data) {
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
        };

    }]);

servicesModule.factory('UserPreferences', ['$resource', 'ServerService', 'UserService', 'ModelUtil', function ($resource, ServerService, UserService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/UserPreferences';
        return function (headers) {
            return $resource(url, {},
                    {
                        query: {
                            method: 'GET',
                            headers: headers || UserService.headers(),
                            isArray: true,
                            transformResponse: ModelUtil.genericTransformResponse
                        },
                        save: {
                            method: 'POST',
                            headers: headers || UserService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        },
                        update: {
                            method: 'PUT',
                            headers: headers || UserService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        }
                    });
        };
    }]);


servicesModule.factory('Range', ['$resource', 'ServerService', 'UserService', 'ModelUtil', function ($resource, ServerService, UserService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Range/:Id';
        return function (headers) {
            return $resource(url,
                    {
                        include: 'unit'
                    },
            {
                query: {
                    method: 'GET',
                    headers: headers || UserService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                save: {
                    method: 'POST',
                    headers: headers || UserService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            var dataToSave = angular.extend({}, data);
                            dataToSave.ACL = UserService.ownerReadWriteACL();

                            if (data.unit && data.unit.objectId) {
                                dataToSave.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                            }

                        }
                        return angular.toJson(dataToSave);
                    }
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            data.ACL = UserService.ownerReadWriteACL();
                        }
                        if (data.unit && data.unit.objectId) {
                            data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                        }
                        return angular.toJson(data);
                    }
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserService.headers()
                }
            });
        };
    }]);