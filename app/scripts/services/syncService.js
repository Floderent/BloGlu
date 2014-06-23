'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('syncService', ['$q', '$http', '$injector', '$rootScope', 'Database', 'dataService', 'ServerService', 'UserService', function($q, $http, $injector, $rootScope, Database, dataService, ServerService, UserService) {
        var syncService = {};
        var dataTimeField = 'updatedAt';

        //syncService.syncStatus = 'outOfDate';

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
            angular.forEach(array, function(value) {
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
            angular.forEach(Database.schema, function(collectionName) {                
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
                console.log("Downloading " + collection);
                deferred.notify("Downloading " + collection);                
                dataService.queryParse(collection, syncStatus.remoteCount, {limit: 1000}).then(function(result) {
                    console.log("Downloading of " + collection + " completed");
                    deferred.notify("Downloading of " + collection + " completed");
                    dataService.clear(collection).then(function() {
                        console.log(collection + " cleared");
                        deferred.notify(collection + " cleared");
                        console.log("Inserting "+ result.length + " result in " + collection);
                        dataService.addRecords(collection, result).then(function(addRecordsResult) {
                            console.log("Inserted " + result.length + collection + " record(s)");
                            deferred.notify("Inserted " + result.length + collection + " record(s)");
                            deferred.resolve();
                        }, deferred.reject);
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
            if (syncService.syncStatus === 'upToDate') {
                deferred.resolve();
            } else {
                console.log("checking sync status");
                syncService.checkSyncStatus().then(function(syncStatus) {
                    console.log("checking sync status - done");
                    angular.forEach(syncStatus, function(value, key) {
                        if (value.status === 'outOfDate') {
                            promiseArray.push(syncCollection(key, value));
                        }
                    });
                    console.log("syncing collections");
                    $q.all(promiseArray).then(function(result) {
                        dataService.init(true).then(function(result) {
                            triggerDataReadyEvent();
                            //syncService.syncStatus = 'upToDate';
                            deferred.resolve();
                        }, deferred.reject);
                    }, deferred.reject, deferred.notify);
                }, deferred.reject);
            }
            return deferred.promise;
        };

        function triggerDataReadyEvent() {
            var eventName = 'dataReady';
            $rootScope.$broadcast(eventName);
        }
        return syncService;
    }]);