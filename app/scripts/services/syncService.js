'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('syncService', ['$q', '$http', '$injector', 'Database', 'dataService', 'ServerService', 'UserService', function($q, $http, $injector, Database, dataService, ServerService, UserService) {
        var syncService = {};
        var dataTimeField = 'updatedAt';

        function getLocalDataInfos() {
            return dataService.init().then(function(result) {
                var localDataInfos = {};
                angular.forEach(result, function(value, key) {
                    localDataInfos[key] = {};
                    localDataInfos[key].count = value.length;
                    localDataInfos[key].date = getMaximumValue(value, dataTimeField);
                });
                return localDataInfos;
            });

        }

        function getMaximumValue(array, field) {
            var maxValue = '';
            array.forEach(function(value) {
                if (value[field] && value[field] > maxValue) {
                    maxValue = value[field];
                }
            });
            return maxValue;
        }

        function compareSyncStatus(remoteDataStatus, localDataStatus) {
            var syncStatus = {};
            angular.forEach(remoteDataStatus, function(value, key) {
                if (localDataStatus[key] && localDataStatus[key].count === value.count && localDataStatus[key].date === value.date) {
                    syncStatus[key] = {
                        status: 'upToDate',
                        localCount: localDataStatus[key].count,
                        remoteCount: value.count
                    };
                } else {
                    syncStatus[key] =
                            {
                                status: 'outOfDate',
                                localCount: localDataStatus[key].count,
                                remoteCount: value.count
                            };
                }
            });
            return syncStatus;
        }


        function getParseDataInfos() {
            var promiseArray = [];
            var parseDataInfos = {};
            Database.schema.forEach(function(collectionName) {
                promiseArray.push($http(
                        {
                            headers: UserService.headers(),
                            method: 'GET',
                            url: ServerService.baseUrl + "classes/" + collectionName,
                            params: {
                                count: '1',
                                order: '-' + dataTimeField,
                                limit: '1'
                            }
                        }
                ));
            });
            return $q.all(promiseArray).then(function(result) {
                for (var i = 0; i < result.length; i++) {
                    parseDataInfos[Database.schema[i]] = {};
                    var lastDate = "";
                    if (result[i].data.results && result[i].data.results.length > 0) {
                        lastDate = result[i].data.results[0][dataTimeField];
                    }
                    parseDataInfos[Database.schema[i]].date = lastDate;
                    parseDataInfos[Database.schema[i]].count = result[i].data.count;
                }
                return parseDataInfos;
            });
        }

        function syncCollection(collection, syncStatus) {
            var deferred = $q.defer();
            var resource = $injector.get(collection);
            if (resource && resource.query) {
                //resource.query({limit: 1000}).$promise
                dataService.queryParse(collection, syncStatus.remoteCount, {limit: 1000}).then(function(result) {
                    dataService.clear(collection).then(function() {
                        dataService.addRecords(collection, result).then(deferred.resolve, deferred.reject);
                    }, deferred.reject);
                }, deferred.reject);
            } else {
                deferred.reject("No resource found for " + collection);
            }
            return deferred.promise;
        }


        syncService.checkSyncStatus = function() {
            return $q.all([
                getParseDataInfos(),
                getLocalDataInfos()
            ]).then(function(result) {
                var parseDataStatus = {};
                var localDataStatus = {};
                if (result.length > 0 && result[0]) {
                    parseDataStatus = result[0];
                }
                if (result.length > 1 && result[1]) {
                    localDataStatus = result[1];
                }
                return compareSyncStatus(parseDataStatus, localDataStatus);
            });
        };

        syncService.sync = function() {
            var deferred = $q.defer();
            var promiseArray = [];
            syncService.checkSyncStatus().then(function(syncStatus) {
                angular.forEach(syncStatus, function(value, key) {
                    if (value.status === 'outOfDate') {
                        promiseArray.push(syncCollection(key,value));
                    }
                });
                $q.all(promiseArray).then(function(result) {
                    dataService.init(true).then(function(result) {
                        triggerDataReadyEvent();
                        deferred.resolve();
                    }, deferred.reject);
                }, deferred.reject);
            }, deferred.reject);
            return deferred.promise;
        };


        function triggerDataReadyEvent() {
            var event;
            var eventName = "dataReady";
            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent(eventName, true, true);
            } else {
                event = document.createEventObject();
                event.eventType = eventName;
            }
            event.eventName = eventName;

            if (document.createEvent) {
                document.dispatchEvent(event);
            } else {
                document.fireEvent("on" + event.eventType, event);
            }
        }
        return syncService;
    }]);