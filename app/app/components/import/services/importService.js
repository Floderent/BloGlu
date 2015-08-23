(function () {
    'use strict';

    angular.module('bloglu.import')
            .factory('importService', importService);


    importService.$inject = ['$http', '$q', 'Upload', 'Batch', 'dataService', 'importUtils', 'ServerService', 'UserSessionService', 'ResourceName', 'unitService'];

    function importService($http, $q, Upload, Batch, dataService, importUtils, ServerService, UserSessionService, ResourceName, unitService) {

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
            dataFormats: importUtils.dataFormats,
            getEventsTypes: getEventsTypes,
            getUnits: getUnits,
            getFormatByName: importUtils.getFormatByName,
            getReferenceUnit: unitService.getReferenceUnit
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
        
        function getEventsTypes(supportedEvents){
            var eventsTypes = {};
            angular.forEach(ResourceName, function (name, index) {
                if (supportedEvents.indexOf(parseInt(index)) !== -1) {
                    eventsTypes[index] = name;
                }
            });
            return eventsTypes;
        }
        
        function getUnits(eventsTypes){
            var unitsByResourceName = {};
            var promiseArray = [];
            angular.forEach(eventsTypes, function (resourceName, key) {
                promiseArray.push(unitService.getUnitsByCode(parseInt(key)).then(function (units) {
                    unitsByResourceName[resourceName] = units;                    
                    return units;
                }));
            });
            return $q.all(promiseArray).then(function(){
                return unitsByResourceName;
            });
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

        function getDataFromFile(file, dataFormatName, importOptions) {            
            var dateFormat = importUtils.getFormatByName(dataFormatName);            
            var dataArray = importUtils.CSVToArray(file, dateFormat.delimiter);
            var linesToskip = dateFormat.skipFirstLine;
            var eventsToInsert = [];
            for (var index in dataArray) {
                if (index >= linesToskip) {
                    var event = dateFormat.getEventFromData(dataArray[index], importOptions);
                    if (event) {
                        eventsToInsert.push(event);
                    }
                }
            }
            return eventsToInsert;
        }
        
        function preprocessDataToImport(data, duplicateData, importObject){
            var dataToImport = data;
            if(duplicateData && duplicateData.length > 0){
                dataToImport = data.filter(function(element){
                    return duplicateData.indexOf(element) < 0;
                });
            }            
            angular.forEach(dataToImport, function(record){
                record.import = importObject;
            });
            return dataToImport;
        }
        
        
        function batchRequestProcess(data, duplicateData, importObject) {
            
            var dataToImport = preprocessDataToImport(data, duplicateData, importObject);
            
            var batchSize = 50;
            var promiseArray = [];
            var batchData = [];
            for (var i in dataToImport) {
                var event = dataToImport[i];
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
                return dataService.addRecords('Event', batchData).then(function(){
                    return dataService.saveAllLocal('Event', batchData);
                });
            });
        }
        
        function checkForDuplicates(eventsToCheck){            
            return dataService.getDuplicates('Event', eventsToCheck, ['dateTime', 'reading', 'code']);
        }
        
        
    }
})();