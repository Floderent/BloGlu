(function () {
    'use strict';

    angular.module('bloglu.import')
            .factory('importService', importService);


    importService.$inject = ['$http', '$q', 'Upload', 'Batch', 'dataService', 'importUtils', 'Event', 'ServerService', 'UserSessionService'];

    function importService($http, $q, Upload, Batch, dataService, importUtils, Event, ServerService, UserSessionService) {

        var uploadUrl = ServerService.baseUrl + 'files/';
        var fileHeaders = angular.extend({'Content-Type': 'text/plain'}, ServerService.headers);
        var resourceName = 'Import';

        var importService = {
            getImports: getImports,
            saveImport: saveImport,
            deleteImport: deleteImport,
            downloadFile: downloadFile,            
            uploadFile: uploadFile,
            processFile: processFile,
            singleRequestProcess: singleRequestProcess,
            getDataFromFile: getDataFromFile,
            batchRequestProcess: batchRequestProcess,
            dataFormats: importUtils.dataFormats
        };
        return importService;


        function getImports() {
            return dataService.queryLocal(resourceName);
        }

        function saveImport(importObject, isEdit) {
            var savingPromise = null;
            if (isEdit) {
                savingPromise = dataService.update(resourceName, importObject.objectId, importObject);
            } else {
                savingPromise = dataService.save(resourceName, importObject);
            }
            return savingPromise;
        }

        function deleteImport(impor) {
            var importId = null;
            if (impor && impor.objectId) {
                importId = impor.objectId;
            } else {
                importId = impor;
            }
            return dataService.remove(resourceName, importId);
        }


        //=========================================================

        function downloadFile(fileLocation) {
            return $http.get(fileLocation).then(function (response) {
                return response.data;
            });
        }

        function uploadFile(file, notify) {
            uploadUrl = uploadUrl + file.name;
            return Upload.upload({
                url: uploadUrl,
                method: 'POST',
                headers: fileHeaders,
                file: file
            }).progress(function (evt) {
                notify(parseInt(100.0 * evt.loaded / evt.total));
            }).then(function (result) {
                return result.data.url;
            });
        }

        function getDataFromFile(file, options) {
            var dataArray = importUtils.CSVToArray(file, ';');
            var linesToskip = 10;
            var eventsToInsert = [];
            for (var index in dataArray) {
                if (index >= linesToskip) {
                    var event = options.getEventFromData(dataArray[index]);
                    if (event) {
                        eventsToInsert.push(event);
                    }
                }
            }
            return eventsToInsert;
        }

        function batchRequestProcess(data) {
            var batchSize = 50;
            var promiseArray = [];
            var batchData = [];
            for (var i in data) {
                var event = data[i];
                batchData.push(event);
                if (batchData.length % batchSize === 0) {
                    promiseArray.push(saveBatch(batchData));
                    batchData = [];
                }
            }
            if (batchData.length > 0) {
                promiseArray.push(saveBatch(batchData));
            }
            return $q.all(promiseArray);
        }

        function saveBatch(batchData) {
            return Batch(UserSessionService.headers()).batchEvent({}, angular.copy(batchData)).$promise.then(function (importedEventsResponse) {
                for (var index in batchData) {
                    batchData[index] = angular.extend(batchData[index], importedEventsResponse[index].success);
                }
                return dataService.addRecords('Event', batchData);
            });
        }
        //=========================================================

        function processFile(file, dataset, options) {
            var resultData = {};
            resultData.dataset = dataset;
            var dataArray = importUtils.CSVToArray(file, ';');
            resultData.fileLines = dataArray.length;
            var promiseArrays = importService.batchRequestProcess(dataArray, options);
            resultData.processedRecords = promiseArrays.remote.length;
            return $q.all(promiseArrays.remote).then(function (remoteImportResult) {
                resultData.remoteImportResult = remoteImportResult;
                $q.all(promiseArrays.local).then(function (localImportResult) {
                    resultData.localImportResult = localImportResult;
                    return resultData;
                });
            });
        }

        function singleRequestProcess(data) {
            var promiseArray = [];
            angular.forEach(data, function (line) {
                var event = getEventFromData(line);
                var promise = Event.save({}, event);
                if (promise) {
                    promiseArray.push(promise);
                }
            });
            return promiseArray;
        }



    }
})();