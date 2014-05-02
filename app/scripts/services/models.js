'use strict';

var servicesModule = angular.module('BloGlu.modelServices', ['ngResource']);

servicesModule.factory('Unit', ['$resource','ServerService', function($resource, ServerService) {
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

servicesModule.factory('ReadingGlucoseBlood', ['$resource','ServerService', 'UserService', 'dateUtil', function($resource, ServerService, UserService, dateUtil) {
        var url = ServerService.baseUrl + "classes/ReadingGlucoseBlood/:Id";
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
                            }
                            return angular.toJson(data);
                        }
                    },
                    delete: {
                        method: 'DELETE',
                        headers: UserService.headers()
                    }

                    /*
                     ,
                     queryBetweenDates: {
                     method: "GET",
                     headers: headers,
                     isArray: true,
                     params: {
                     where: {"dateTime": {"$gt": {"__type": "Date", "iso": ":beginDate"}, "&lt": {"__type": "Date", "iso": ":endDate"}}}
                     },
                     transformResponse: function(data) {
                     var jsonResponse = angular.fromJson(data);
                     if (jsonResponse && jsonResponse.results) {
                     jsonResponse = jsonResponse.results;
                     }
                     return jsonResponse;
                     }
                     }
                     */
                });
    }]);




servicesModule.factory('BloodGlucoseTarget', ['$resource','ServerService', 'UserService', function($resource,ServerService, UserService) {
        var url = ServerService.baseUrl + "classes/Target";
        return $resource(url, {},
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

servicesModule.factory('Period', ['$resource','ServerService', 'UserService', 'dateUtil', function($resource, ServerService, UserService, dateUtil) {
        var url = ServerService.baseUrl + 'classes/Period/:periodId';
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


servicesModule.factory('User', ['$resource','ServerService', 'UserService', function($resource, ServerService, UserService) {
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

servicesModule.factory('UserPreferences', ['$resource','ServerService', 'UserService', function($resource, ServerService, UserService) {
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