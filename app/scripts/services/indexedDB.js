'use strict';

var servicesModule = angular.module('BloGlu.services');

servicesModule.factory('indexeddbService', ['$window', '$q', 'Database', function($window, $q, Database) {
        var indexedDB = $window.indexedDB;
        var db = null;
        var databaseName = 'bloglu';
        var indexeddbService = {};

        function openDatabase() {
            var deferred = $q.defer();
            if (db === null) {
                var version = 1;
                var request = indexedDB.open(databaseName, version);
                request.onupgradeneeded = function(e) {
                    db = e.target.result;
                    e.target.transaction.onerror = indexedDB.onerror;
                    recreateDatabaseSchema(db, Database.schema);
                };

                request.onsuccess = function(e) {
                    db = e.target.result;
                    db.onversionchange = function(event) {
                        event.target.close();
                    };
                    deferred.resolve(db);
                };
                request.onblocked = function(error) {
                    deferred.reject(error);
                };
                request.onerror = function(error) {
                    deferred.reject(error);
                };
            } else {
                deferred.resolve(db);
            }
            return deferred.promise;
        }
        ;

        function recreateDatabaseSchema(database, resourceNames) {
            resourceNames.forEach(function(resourceName) {
                if (database.objectStoreNames.contains(resourceName)) {
                    database.deleteObjectStore(resourceName);
                }
                database.createObjectStore(resourceName, {keyPath: 'objectId'});
            });
        }
        indexeddbService.dropDatabase = function() {
            var deferred = $q.defer();
            if (db) {
                db.close();
            }
            var req = indexedDB.deleteDatabase(databaseName);
            req.onsuccess = function(result) {               
                db = null;
                deferred.resolve(result);
            };
            req.onerror = function(error) {                
                db = null;
                deferred.reject(error);
            };
            req.onblocked = function(error) {                
                db = null;
                deferred.reject(error);
            };
            return deferred.promise;
        };

        indexeddbService.getData = function(collection) {
            var deferred = $q.defer();
            openDatabase().then(function(db) {
                var trans = db.transaction([collection], 'readonly');
                var store = trans.objectStore(collection);
                var dataArray = [];
                var keyRange = IDBKeyRange.lowerBound(0);
                var cursorRequest = store.openCursor(keyRange);
                cursorRequest.onsuccess = function(e) {
                    var result = e.target.result;
                    if (result === null || result === undefined) {
                        deferred.resolve(dataArray);
                    }
                    else {
                        dataArray.push(result.value);
                        result.continue();
                    }
                };
                cursorRequest.onerror = function(e) {
                    deferred.reject(e);
                };
            }, deferred.reject);
            return deferred.promise;
        };

        indexeddbService.getWholeDatabase = function() {
            var deferred = $q.defer();
            var promiseArray = [];
            Database.schema.forEach(function(collectionName) {
                promiseArray.push(indexeddbService.getData(collectionName));
            });
            $q.all(promiseArray).then(function resolve(result) {
                var allData = {};
                for (var i = 0; i < result.length; i++) {
                    allData[Database.schema[i]] = result[i];
                }
                deferred.resolve(allData);
            }, deferred.reject);
            return deferred.promise;
        };

        indexeddbService.clear = function(collection) {
            var deferred = $q.defer();
            openDatabase().then(function(db) {
                var trans = db.transaction([collection], 'readwrite');
                var store = trans.objectStore(collection);
                var clearRequest = store.clear();
                clearRequest.onsuccess = function(result) {
                    deferred.resolve(result);
                };
                clearRequest.onerror = function(error) {
                    deferred.reject(error);
                };
                deferred.resolve();
            });
            return deferred.promise;
        };

        indexeddbService.addRecord = function(collection, record) {
            var deferred = $q.defer();
            openDatabase().then(function(db) {
                var trans = db.transaction([collection], 'readwrite');
                var store = trans.objectStore(collection);
                var request = store.put(record);
                request.onsuccess = function(e) {
                    deferred.resolve(e);
                };
                request.onerror = function(e) {
                    deferred.reject(e);
                };
            }, deferred.reject);
            return deferred.promise;
        };

        indexeddbService.addRecords = function(collection, records) {
            var deferred = $q.defer();
            var i = 0;
            openDatabase().then(function(db) {
                var transaction = db.transaction(collection, 'readwrite');
                var itemStore = transaction.objectStore(collection);
                putNext();
                function putNext() {
                    if (i < records.length) {
                        itemStore.put(records[i]).onsuccess = putNext;
                        itemStore.put(records[i]).onerror = function(error) {
                            deferred.reject(error);
                        };
                        ++i;
                    } else {
                        deferred.resolve();
                    }
                }
            }, deferred.reject);
            return deferred.promise;
        };



        indexeddbService.deleteRecord = function(collection, record) {
            var deferred = $q.defer();
            openDatabase().then(function(db) {
                var trans = db.transaction([collection], 'readwrite');
                var store = trans.objectStore(collection);
                var id = record;
                if (record.objectId) {
                    id = record.objectId;
                }
                var request = store.delete(id);
                request.onsuccess = function(e) {
                    deferred.resolve(e);
                };
                request.onerror = function(e) {
                    deferred.reject(e);
                };
            }, deferred.reject);
            return deferred.promise;
        };
        return indexeddbService;
    }]);

