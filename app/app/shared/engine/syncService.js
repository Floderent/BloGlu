(function () {
    'use strict';

    angular.module('bloglu.engine')
            .factory('syncService', syncService);

    syncService.$inject = ['$q', '$injector', '$rootScope', 'Database', 'dataService', 'UserSessionService'];


    function syncService($q, $injector, $rootScope, Database, dataService, UserSessionService) {
        var syncService = {};
        var dataTimeField = 'updatedAt';
        //syncService.syncStatus = 'outOfDate';
        function getLocalDataInfos() {
            return dataService.init().then(function (result) {
                var localDataInfos = {};
                angular.forEach(result, function (value, key) {
                    localDataInfos[key] = {};
                    localDataInfos[key].count = value.length;
                    localDataInfos[key].date = getMaximumValue(value, dataTimeField);
                });
                return localDataInfos;
            });

        }

        function getMaximumValue(array, field) {
            var maxValue = '';
            angular.forEach(array, function (value) {
                if (value[field] && value[field] > maxValue) {
                    maxValue = value[field];
                }
            });
            return maxValue;
        }

        function compareSyncStatus(remoteDataStatus, localDataStatus) {
            var syncStatus = {};
            angular.forEach(remoteDataStatus, function (value, key) {
                if (localDataStatus[key] && localDataStatus[key].count === value.count && localDataStatus[key].date === value.date) {
                    syncStatus[key] = {
                        status: 'upToDate',
                        localCount: localDataStatus[key].count,
                        remoteCount: value.count
                    };
                } else {
                    syncStatus[key] = {
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
            angular.forEach(Database.schema, function (collectionName) {
                var resource = $injector.get(collectionName)(UserSessionService.headers());
                if (resource.countForSync) {
                    promiseArray.push(resource.countForSync().$promise);
                }
            });
            return $q.all(promiseArray).then(function (result) {
                for (var i = 0; i < result.length; i++) {
                    parseDataInfos[Database.schema[i]] = {};
                    var lastDate = "";
                    if (result[i].results && result[i].results.length > 0) {
                        lastDate = result[i].results[0][dataTimeField];
                    }
                    parseDataInfos[Database.schema[i]].date = lastDate;
                    parseDataInfos[Database.schema[i]].count = result[i].count;
                }
                return parseDataInfos;
            });
        }

        function syncCollection(collection, syncStatus, notify) {
            var deferred = $q.defer();
            var resource = $injector.get(collection)(UserSessionService.headers());
            if (resource && resource.query) {
                dataService.queryParse(collection, syncStatus.remoteCount, {limit: 1000}).then(function (result) {
                    dataService.clear(collection).then(function () {
                        dataService.addRecords(collection, result).then(function (addRecordsResult) {
                            notify(1, collection + ' sync');
                            deferred.resolve();
                        }, deferred.reject);
                    }, deferred.reject);
                }, deferred.reject);
            } else {
                deferred.reject('No resource found for ' + collection);
            }
            return deferred.promise;
        }


        syncService.checkSyncStatus = function () {
            return $q.all([
                getParseDataInfos(),
                getLocalDataInfos()
            ]).then(function (result) {
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

        syncService.sync = function (notify, mode) {
            var deferred = $q.defer();
            var notificationFunc = computeProgression(1, notify);
            var promiseArray = [];
            if (syncService.syncStatus === 'upToDate' || mode === 'offline') {
                triggerSync(notificationFunc).then(deferred.resolve, deferred.reject);
            } else {
                syncService.checkSyncStatus().then(function (syncStatus) {
                    notificationFunc(1, 'syncStatusChecked');
                    notificationFunc = computeProgression(getNumberOfOutOfSyncCollections(syncStatus), notify);
                    angular.forEach(syncStatus, function (value, key) {
                        if (value.status === 'outOfDate') {
                            promiseArray.push(syncCollection(key, value, notificationFunc));
                        }
                    });
                    $q.all(promiseArray).then(function (result) {
                        notificationFunc = computeProgression(1, notify);
                        triggerSync(notificationFunc);
                        deferred.resolve();
                    }, deferred.reject, deferred.notify);
                }, deferred.reject);
            }
            return deferred.promise;
        };

        function computeProgression(num, progress) {
            var total = 0;
            return function (progression, message) {
                total += progression;
                if (progress && typeof progress === 'function') {
                    progress(((total / num) * 100).toFixed(2), message);
                }
            };
        }

        function getNumberOfOutOfSyncCollections(syncStatus) {
            var numberOfOutOfSyncCollections = 0;
            angular.forEach(syncStatus, function (value, key) {
                if (value.status === 'outOfDate') {
                    numberOfOutOfSyncCollections++;
                }
            });
            return numberOfOutOfSyncCollections;
        }

        function triggerSync(notificationFunc) {            
            return dataService.init(true).then(function (result) {
                notificationFunc(1, 'syncDone');
                triggerDataReadyEvent();
                return;
            });            
        }

        function triggerDataReadyEvent() {
            var eventName = 'dataReady';
            $rootScope.$broadcast(eventName);
        }
        return syncService;
    }
})();