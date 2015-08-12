(function () {
    'use strict';

    angular.module('bloglu.import')
            .factory('importService', importService);


    importService.$inject = ['$http', '$q', '$upload', 'Batch', 'dataService', 'importUtils', 'Event', 'ServerService', 'UserSessionService'];

    function importService($http, $q, $upload, Batch, dataService, importUtils, Event, ServerService, UserSessionService) {

        var uploadUrl = ServerService.baseUrl + 'files/';
        var fileHeaders = angular.extend({'Content-Type': 'text/plain'}, ServerService.headers);
        var resourceName = 'Import';

        var importService = {
            getImports: getImports,
            saveImport: saveImport,
            deleteImport: deleteImport,
            downloadFile: downloadFile,
            importData: importData,
            uploadFile: uploadFile,
            processFile: processFile,
            singleRequestProcess: singleRequestProcess,
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

        function downloadFile(fileLocation) {
            return $http.get(fileLocation);
        }

        function importData(importObject, file, options) {
            var resultData = {};
            return $q(function (resolve, reject) {
                importService.saveImport(importObject).then(function (savedImport) {
                    importService.uploadFile(file).then(function (result) {
                        if (result && result.data && result.data.url) {
                            resultData.fileUrl = result.data.url;
                            importService.downloadFile(result.data.url).then(function (result) {
                                importService.processFile(result.data, savedImport.objectId, options).then(function (result) {
                                    resultData = angular.extend(resultData, result);
                                    savedImport.file = resultData.fileUrl;
                                    resultData.import = savedImport;
                                    resolve(resultData);
                                });
                            }, reject);
                        } else {
                            reject('file not uploaded');
                        }
                    }, reject, function progress(evt) {
                    });
                }, reject);
            });
        }

        function uploadFile(file) {
            uploadUrl = uploadUrl + file.name;
            return $upload.upload({
                url: uploadUrl,
                method: 'POST',
                headers: fileHeaders,
                // withCredentials: true,
                //data: {myObj: $scope.myModelObj},
                file: file // or list of files: $files for html5 only
                        /* set the file formData name ('Content-Desposition'). Default is 'file' */
                        //fileFormDataName: myFile, //or a list of names for multiple files (html5).
                        /* customize how data is added to formData. See #40#issuecomment-28612000 for sample code */
                        //formDataAppender: function(formData, key, val){}
            });
            //.error(...)
            //.then(success, error, progress); 
            //.xhr(function(xhr){xhr.upload.addEventListener(...)})// access and attach any event listener to XMLHttpRequest.
        }

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

        function batchRequestProcess(data, options) {
            var batchSize = 50;
            var promiseArrayRemote = [];
            var promiseArrayLocal = [];
            var batchData = [];
            for (var i in data) {
                var event = options.getEventFromData(data[i]);
                if (event) {
                    batchData.push(event);
                    if (batchData.length % batchSize === 0) {
                        //add remote
                        promiseArrayRemote.push(Batch(UserSessionService.headers()).batchEvent({}, angular.copy(batchData)));
                        //add local
                        //promiseArrayLocal.push(dataService.addRecords('Event', batchData));
                        batchData = [];
                    }
                }
            }
            if (batchData.length > 0) {
                //add remote
                promiseArrayRemote.push(Batch(UserSessionService.headers()).batchEvent({}, angular.copy(batchData)));
                //add local
                //promiseArrayLocal.push(dataService.addRecords('Event', batchData));                
            }
            return {remote: promiseArrayRemote, local: promiseArrayLocal};
        }

    }
})();