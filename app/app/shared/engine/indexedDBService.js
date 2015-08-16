(function () {
    'use strict';

    angular.module('bloglu.engine')
            .factory('indexeddbService', indexeddbService);


    indexeddbService.$inject = ['$window', '$q', 'Database'];

    function indexeddbService($window, $q, Database) {
        var indexedDB = $window.indexedDB;
        var db = null;
        var databaseName = 'bloglu';

        var indexeddbService = {
            dropDatabase: dropDatabase,
            getData: getData,
            clear: clear,
            clearUserCollection: clearUserCollection,
            clearCollections: clearCollections,
            addRecord: addRecord,
            addRecords: addRecords,
            deleteRecord: deleteRecord
        };
        return indexeddbService;


        function openDatabase() {
            return $q(function (resolve, reject) {
                if (db === null) {
                    var version = 2;
                    var request = indexedDB.open(databaseName, version);
                    request.onupgradeneeded = function (e) {
                        db = e.target.result;
                        e.target.transaction.onerror = indexedDB.onerror;
                        recreateDatabaseSchema(db, Database.schema);
                    };

                    request.onsuccess = function (e) {
                        db = e.target.result;
                        db.onversionchange = function (event) {
                            event.target.close();
                        };
                        resolve(db);
                    };
                    request.onblocked = function (error) {
                        reject(error);
                    };
                    request.onerror = function (error) {
                        reject(error);
                    };
                } else {
                    resolve(db);
                }
            });
        }

        function recreateDatabaseSchema(database, resourceNames) {
            angular.forEach(resourceNames, function (resourceName) {
                if (database.objectStoreNames.contains(resourceName)) {
                    database.deleteObjectStore(resourceName);
                }
                var objectStore = database.createObjectStore(resourceName, {keyPath: 'objectId'});
                objectStore.createIndex('userIndex', 'userId', {uniques: false});
            });
        }

        function dropDatabase() {
            return $q(function (resolve, reject) {
                if (db) {
                    db.close();
                }
                var req = indexedDB.deleteDatabase(databaseName);
                req.onsuccess = function (result) {
                    db = null;
                    resolve(result);
                };
                req.onerror = function (error) {
                    db = null;
                    reject(error);
                };
                req.onblocked = function (error) {
                    db = null;
                    reject(error);
                };
            });
        }

        function getData(collection, userId) {
            return $q(function (resolve, reject) {
                openDatabase().then(function (db) {
                    var trans = db.transaction([collection], 'readonly');
                    var store = trans.objectStore(collection);
                    var dataArray = [];

                    var range = IDBKeyRange.only(userId);
                    var index = store.index('userIndex');

                    //var keyRange = IDBKeyRange.lowerBound(0);
                    var cursorRequest = index.openCursor(range);
                    cursorRequest.onsuccess = function (e) {
                        var result = e.target.result;
                        if (result === null || result === undefined) {
                            resolve(dataArray);
                        }
                        else {
                            dataArray.push(result.value);
                            result.continue();
                        }
                    };
                    cursorRequest.onerror = function (e) {
                        reject(e);
                    };
                }, reject);
            });
        }

        function clear(collection) {
            return $q(function (resolve, reject) {
                openDatabase().then(function (db) {
                    var trans = db.transaction([collection], 'readwrite');
                    var store = trans.objectStore(collection);
                    var clearRequest = store.clear();
                    clearRequest.onsuccess = function (result) {
                        resolve(result);
                    };
                    clearRequest.onerror = function (error) {
                        reject(error);
                    };
                    resolve();
                });
            });
        }

        function clearUserCollection(collection, userId) {
            return $q(function (resolve, reject) {
                openDatabase().then(function (db) {
                    var trans = db.transaction([collection], 'readwrite');
                    var store = trans.objectStore(collection);
                    var range = IDBKeyRange.only(userId);
                    var index = store.index('userIndex');
                    var cursorRequest = index.openCursor(range);
                    cursorRequest.onsuccess = function () {
                        var cursor = cursorRequest.result;
                        if (cursor) {
                            store.delete(cursor.primaryKey);
                            cursor.continue();
                        } else {
                            resolve();
                        }
                    };
                    cursorRequest.onerror = function (error) {
                        reject(error);
                    };
                });
            });
        }

        function clearCollections(collections, userId) {
            var promiseArray = [];
            openDatabase().then(function (db) {
                var trans = db.transaction(collections, 'readwrite');
                var promise = $q(function (resolve, reject) {
                    angular.forEach(collections, function (collection) {
                        var store = trans.objectStore(collection);
                        var range = IDBKeyRange.only(userId);
                        var index = store.index('userIndex');
                        var cursorRequest = index.openCursor(range);
                        cursorRequest.onsuccess = function () {
                            var cursor = cursorRequest.result;
                            if (cursor) {
                                store.delete(cursor.primaryKey);
                                cursor.continue;
                            } else {
                                resolve();
                            }
                        };
                        cursorRequest.onerror = function (error) {
                            reject(error);
                        };
                        resolve();
                    });
                });
                promiseArray.push(promise);
            });
            return $q.all(promiseArray);
        }

        function addRecord(collection, userId, record) {
            return $q(function (resolve, reject) {                
                openDatabase().then(function (db) {
                    var trans = db.transaction([collection], 'readwrite');
                    var store = trans.objectStore(collection);
                    record.userId = userId;
                    var request = store.put(record);
                    request.onsuccess = function (e) {
                        resolve(e);
                    };
                    request.onerror = function (e) {
                        reject(e);
                    };
                }, reject);
            });
        }
       
        function addRecords(collection, userId, records) {
            return $q(function (resolve, reject) {
                var i = 0;
                openDatabase().then(function (db) {
                    var transaction = db.transaction(collection, 'readwrite');
                    var itemStore = transaction.objectStore(collection);
                    putNext();
                    function putNext() {
                        if (i < records.length) {                            
                            records[i].userId = userId;
                            itemStore.put(records[i]).onsuccess = putNext;
                            itemStore.put(records[i]).onerror = function (error) {
                                reject(error);
                            };
                            ++i;
                        } else {
                            resolve();
                        }
                    }
                }, reject);
            });
        }


        function deleteRecord(collection, record) {
            return $q(function (resolve, reject) {
                openDatabase().then(function (db) {
                    var trans = db.transaction([collection], 'readwrite');
                    var store = trans.objectStore(collection);
                    var id = record;
                    if (record.objectId) {
                        id = record.objectId;
                    }
                    var request = store.delete(id);
                    request.onsuccess = function (e) {
                        resolve(e);
                    };
                    request.onerror = function (e) {
                        reject(e);
                    };
                }, reject);
            });
        }

    }
})();
