(function () {

    'use strict';

    angular.module('bloglu.engine')
            .factory('ModelUtil', ModelUtil)
            .factory('Unit', Unit)
            .factory('Report', Report)
            .factory('Import', Import)
            .factory('Dashboard', Dashboard)
            .factory('Metadatamodel', Metadatamodel)
            .factory('Batch', Batch)
            .factory('Event', Event)
            .factory('Period', Period)
            .factory('Category', Category)
            .factory('UserPreferences', UserPreferences)
            .factory('Range', Range)
            .factory('User', User);

    ModelUtil.$inject = ['dateUtil', 'UserSessionService'];
    Unit.$inject = ['$resource', 'ServerService', 'ModelUtil'];
    Report.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];
    Import.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];
    Dashboard.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];
    Metadatamodel.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];
    Batch.$inject = ['$resource', 'ServerService', 'UserSessionService', 'dateUtil'];
    Event.$inject = ['$resource', 'ServerService', 'UserSessionService', 'dateUtil'];
    Period.$inject = ['$resource', 'ServerService', 'UserSessionService', 'dateUtil'];
    Category.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];
    UserPreferences.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];
    Range.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];
    User.$inject = ['$resource', 'ServerService', 'UserSessionService', 'ModelUtil'];


    function ModelUtil(dateUtil, UserSessionService) {
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
                data.ACL = UserSessionService.ownerReadWriteACL();
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

    }


    function Unit($resource, ServerService, ModelUtil) {
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
                },
                countForSync: {
                    method: 'GET',
                    headers: headers || ServerService.headers(),
                    params: {
                        count: '1',
                        order: '-updatedAt',
                        limit: '1'
                    }
                }
            });
        };
    }







    function Report($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Report/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                count: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers()
                },
                countForSync: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    params: {
                        count: '1',
                        order: '-updatedAt',
                        limit: '1'
                    }
                },
                save: {
                    method: 'POST',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                get: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers()
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserSessionService.headers()
                }
            });
        };
    }


    function Import($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Import/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
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
                    headers: headers || UserSessionService.headers()
                },
                countForSync: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    params: {
                        count: '1',
                        order: '-updatedAt',
                        limit: '1'
                    }
                },
                save: {
                    method: 'POST',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: function (data) {
                        data = ModelUtil.transformToParseFormat(data, [{field: 'beginDate', type: 'date'}, {field: 'endDate', type: 'date'}, {field: 'dateTime', type: 'date'}, {field: 'bgUnit', type: 'pointer', className: 'Unit'}, {field: 'file', type: 'file'}], UserSessionService.ownerReadWriteACL());
                        return angular.toJson(data);
                    }
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: function (data) {
                        data = ModelUtil.transformToParseFormat(data, [{field: 'beginDate', type: 'date'}, {field: 'endDate', type: 'date'}, {field: 'dateTime', type: 'date'}, {field: 'bgUnit', type: 'pointer', className: 'Unit'}, {field: 'file', type: 'file'}], UserSessionService.ownerReadWriteACL());
                        return angular.toJson(data);
                    }
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserSessionService.headers()
                }
            });
        };
    }


    function Dashboard($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Dashboard/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                count: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers()
                },
                countForSync: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    params: {
                        count: '1',
                        order: '-updatedAt',
                        limit: '1'
                    }
                },
                save: {
                    method: 'POST',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                get: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers()
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: ModelUtil.genericTransformRequest
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserSessionService.headers()
                }
            });
        };
    }



    function Metadatamodel($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Metadatamodel/:Id';
        return function (headers) {
            return $resource(url,
                    {Id: '@Id'},
            {
                query: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                count: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers()
                },
                countForSync: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    params: {
                        count: '1',
                        order: '-updatedAt',
                        limit: '1'
                    }
                },
                get: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers()
                }
            });
        };
    }


    function Batch($resource, ServerService, UserSessionService, dateUtil) {
        var url = ServerService.baseUrl + 'batch';

        return function (headers) {
            return $resource(url,
                    {},
                    {
                        batchEvent: {
                            method: 'POST',
                            headers: headers || UserSessionService.headers(),
                            isArray: true,
                            transformRequest: function (data) {
                                var dataToSend = [];
                                angular.forEach(data, function (event) {
                                    var postEvent = {};
                                    if (event) {
                                        event.ACL = UserSessionService.ownerReadWriteACL();
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
    }


    function Event($resource, ServerService, UserSessionService, dateUtil) {
        var url = ServerService.baseUrl + "classes/Event/:Id";

        return function (headers) {
            return $resource(url, {
                include: 'unit,category'
            },
            {
                query: {
                    method: 'GET',
                    cache: false,
                    headers: headers || UserSessionService.headers(),
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
                    headers: headers || UserSessionService.headers()
                },
                countForSync: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    params: {
                        count: '1',
                        order: '-updatedAt',
                        limit: '1'
                    }
                },
                save: {
                    method: 'POST',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            data.ACL = UserSessionService.ownerReadWriteACL();
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
                    headers: headers || UserSessionService.headers(),
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
                    headers: headers || UserSessionService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            data.ACL = UserSessionService.ownerReadWriteACL();
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
                    headers: headers || UserSessionService.headers()
                }
            });
        };

    }



    function Period($resource, ServerService, UserSessionService, dateUtil) {
        var url = ServerService.baseUrl + 'classes/Period/:Id';
        return function (headers) {
            return $resource(url,
                    {
                    },
                    {
                        query: {
                            method: 'GET',
                            headers: headers || UserSessionService.headers(),
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
                            headers: headers || UserSessionService.headers(),
                            transformRequest: function (data) {
                                if (data) {
                                    var dataToSave = angular.extend({}, data);
                                    dataToSave.ACL = UserSessionService.ownerReadWriteACL();
                                    if (dataToSave.begin && dataToSave.end) {
                                        dataToSave.begin = dateUtil.convertToParseFormat(dataToSave.begin);
                                        dataToSave.end = dateUtil.convertToParseFormat(dataToSave.end);
                                    }
                                }
                                return angular.toJson(dataToSave);
                            }
                        },
                        countForSync: {
                            method: 'GET',
                            headers: headers || UserSessionService.headers(),
                            params: {
                                count: '1',
                                order: '-updatedAt',
                                limit: '1'
                            }
                        },
                        update: {
                            method: 'PUT',
                            headers: headers || UserSessionService.headers(),
                            transformRequest: function (data) {
                                if (data) {
                                    data.ACL = UserSessionService.ownerReadWriteACL();
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
                            headers: headers || UserSessionService.headers()
                        }
                    });
        };
    }






    function Category($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Category/:Id';
        return function (headers) {
            return $resource(url,
                    {
                    },
                    {
                        query: {
                            method: 'GET',
                            headers: headers || UserSessionService.headers(),
                            isArray: true,
                            transformResponse: ModelUtil.genericTransformResponse
                        },
                        save: {
                            method: 'POST',
                            headers: headers || UserSessionService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        },
                        update: {
                            method: 'PUT',
                            headers: headers || UserSessionService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        },
                        delete: {
                            method: 'DELETE',
                            headers: headers || UserSessionService.headers()
                        },
                        countForSync: {
                            method: 'GET',
                            headers: headers || UserSessionService.headers(),
                            params: {
                                count: '1',
                                order: '-updatedAt',
                                limit: '1'
                            }
                        }
                    });
        };
    }



    function UserPreferences($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/UserPreferences';
        return function (headers) {
            return $resource(url, {},
                    {
                        query: {
                            method: 'GET',
                            headers: headers || UserSessionService.headers(),
                            isArray: true,
                            transformResponse: ModelUtil.genericTransformResponse
                        },
                        save: {
                            method: 'POST',
                            headers: headers || UserSessionService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        },
                        update: {
                            method: 'PUT',
                            headers: headers || UserSessionService.headers(),
                            transformRequest: ModelUtil.genericTransformRequest
                        }
                    });
        };
    }






    function Range($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'classes/Range/:Id';
        return function (headers) {
            return $resource(url,
                    {
                        include: 'unit'
                    },
            {
                query: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    isArray: true,
                    transformResponse: ModelUtil.genericTransformResponse
                },
                save: {
                    method: 'POST',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            var dataToSave = angular.extend({}, data);
                            dataToSave.ACL = UserSessionService.ownerReadWriteACL();

                            if (data.unit && data.unit.objectId) {
                                dataToSave.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                            }

                        }
                        return angular.toJson(dataToSave);
                    }
                },
                update: {
                    method: 'PUT',
                    headers: headers || UserSessionService.headers(),
                    transformRequest: function (data) {
                        if (data) {
                            data.ACL = UserSessionService.ownerReadWriteACL();
                        }
                        if (data.unit && data.unit.objectId) {
                            data.unit = {__type: 'Pointer', className: 'Unit', objectId: data.unit.objectId};
                        }
                        return angular.toJson(data);
                    }
                },
                delete: {
                    method: 'DELETE',
                    headers: headers || UserSessionService.headers()
                },
                countForSync: {
                    method: 'GET',
                    headers: headers || UserSessionService.headers(),
                    params: {
                        count: '1',
                        order: '-updatedAt',
                        limit: '1'
                    }
                }
            });
        };
    }


    function User($resource, ServerService, UserSessionService, ModelUtil) {
        var url = ServerService.baseUrl + 'users/:Id';
        return function (headers) {
            return $resource(url,
                    {
                    },
                    {
                        query: {
                            method: 'GET',
                            headers: headers || UserSessionService.headers(),
                            isArray: true,
                            transformResponse: ModelUtil.genericTransformResponse
                        },
                        countForSync: {
                            method: 'GET',
                            headers: headers || UserSessionService.headers(),
                            params: {
                                count: '1',
                                order: '-updatedAt',
                                limit: '1'
                            }
                        },
                        update: {
                            method: "PUT",
                            headers: headers || UserSessionService.headers(),
                            transformRequest: function (data) {
                                if (data) {
                                    data.ACL = UserSessionService.ownerReadWriteACL();
                                    if (data.sessionToken) {
                                        delete data.sessionToken;
                                    }
                                }
                                return angular.toJson(data);
                            }
                        },
                        delete: {
                            method: 'DELETE',
                            headers: headers || UserSessionService.headers()
                        }
                    });
        };
    }
})();
