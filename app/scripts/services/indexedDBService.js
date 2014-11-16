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
                var version = 2;
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
            angular.forEach(resourceNames, function(resourceName) {
                if (database.objectStoreNames.contains(resourceName)) {
                    database.deleteObjectStore(resourceName);
                }
                var objectStore = database.createObjectStore(resourceName, {keyPath: 'objectId'});
                objectStore.createIndex('userIndex', 'userId', {uniques: false});
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

        indexeddbService.getData = function(collection, userId) {
            var deferred = $q.defer();
            openDatabase().then(function(db) {
                var trans = db.transaction([collection], 'readonly');
                var store = trans.objectStore(collection);
                var dataArray = [];

                var range = IDBKeyRange.only(userId);
                var index = store.index('userIndex');

                //var keyRange = IDBKeyRange.lowerBound(0);
                var cursorRequest = index.openCursor(range);
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


        indexeddbService.clear = function(collection, userId) {
            var deferred = $q.defer();
            openDatabase().then(function(db) {
                var trans = db.transaction([collection], 'readwrite');
                var store = trans.objectStore(collection);                
                var range = IDBKeyRange.only(userId);
                var index = store.index('userIndex');                
                var cursorRequest = index.openCursor(range);
                cursorRequest.onsuccess = function() {
                    var cursor = cursorRequest.result;                    
                    if (cursor) {
                        store.delete(cursor.primaryKey);                        
                        cursor.continue();
                    } else {                        
                        deferred.resolve();
                    }
                };
                cursorRequest.onerror = function(error) {
                    deferred.reject(error);
                };               
            });
            return deferred.promise;
        };

        indexeddbService.clearCollections = function(collections, userId) {
            var deferred = $q.defer();
            var promiseArray = [];
            debugger;
            openDatabase().then(function(db) {
                var trans = db.transaction(collections, 'readwrite');
                var def = $q.defer();
                angular.forEach(collections, function(collection) {
                    debugger;
                    var store = trans.objectStore(collection);
                    var range = IDBKeyRange.only(userId);
                    var index = store.index('userIndex');

                    var cursorRequest = index.openCursor(range);
                    cursorRequest.onsuccess = function() {
                        var cursor = cursorRequest.result;
                        if (cursor) {
                            store.delete(cursor.primaryKey);
                            cursor.continue;
                        } else {
                            def.resolve();
                        }
                    };
                    cursorRequest.onerror = function(error) {
                        def.reject(error);
                    };
                    def.resolve();
                    promiseArray.push(def.promise);                    
                });
            });   
            debugger;
            $q.all(promiseArray).then(deferred.resolve, deferred.reject);            
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

        indexeddbService.addRecords = function(collection, userId, records) {
            var deferred = $q.defer();
            var i = 0;
            openDatabase().then(function(db) {
                var transaction = db.transaction(collection, 'readwrite');
                var itemStore = transaction.objectStore(collection);
                putNext();
                function putNext() {
                    if (i < records.length) {
                        records[i].userId = userId;
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

