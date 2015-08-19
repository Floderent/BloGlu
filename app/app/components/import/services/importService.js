(function () {
    'use strict';

    angular.module('bloglu.import')
            .factory('importService', importService);


    importService.$inject = ['$http', '$q', 'Upload', 'Batch', 'dataService', 'importUtils', 'ServerService', 'UserSessionService'];

    function importService($http, $q, Upload, Batch, dataService, importUtils, ServerService, UserSessionService) {

        var uploadUrl = ServerService.baseUrl + 'files/';
        var fileHeaders = angular.extend({'Content-Type': 'text/plain'}, ServerService.headers);
        var resourceName = 'Import';

        var importService = {
            getImports: getImports,
            saveImport: saveImport,
            deleteImport: deleteImport,
            downloadFile: downloadFile,            
            uploadFile: uploadFile,            
            getDataFromFile: getDataFromFile,
            batchRequestProcess: batchRequestProcess,
            checkForDuplicates: checkForDuplicates,
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

        function getDataFromFile(file, dataFormatName) {            
            var dateFormat = importUtils.getFormatByName(dataFormatName);            
            var dataArray = importUtils.CSVToArray(file, dateFormat.delimiter);
            var linesToskip = dateFormat.skipFirstLine;
            var eventsToInsert = [];
            for (var index in dataArray) {
                if (index >= linesToskip) {
                    var event = dateFormat.getEventFromData(dataArray[index]);
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
        
        function checkForDuplicates(eventsToCheck){
            return dataService.getDuplicates('Event', eventsToCheck, ['dateTime', 'reading', 'code']);
        }
        
        
    }
})();