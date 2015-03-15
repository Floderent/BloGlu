(function () {
    'use strict';

    angular.module('bloglu.import')
            .factory('importService', importService);


    importService.$inject = [
        '$http',
        '$q',
        '$upload',
        'Batch',
        'dataService',
        'dateUtil',
        'Event',
        'ServerService',
        'UserSessionService'];

    function importService(
            $http,
            $q,
            $upload,
            Batch,
            dataService,
            dateUtil,
            Event,
            ServerService,
            UserSessionService) {
        var importService = {};
        var uploadUrl = ServerService.baseUrl + 'files/';
        var fileHeaders = angular.extend({'Content-Type': 'text/plain'}, ServerService.headers);


        importService.getImports = function () {
            return dataService.queryLocal('Import');
        };

        importService.saveImport = function (importObject, isEdit) {
            var savingPromise = null;
            if (isEdit) {
                savingPromise = dataService.update('Import', importObject.objectId, importObject);
            } else {
                savingPromise = dataService.save('Import', importObject);
            }
            return savingPromise;
        };



        importService.deleteImport = function (impor) {
            var importId = null;
            if (impor && impor.objectId) {
                importId = impor.objectId;
            } else {
                importId = impor;
            }
            return dataService.delete('Report', importId);
        };

        importService.importData = function (importObject, file, options) {
            var resultData = {};
            var deferred = $q.defer();
            importService.saveImport(importObject).then(function (savedImport) {
                importService.uploadFile(file).then(function resolve(result) {
                    if (result && result.data && result.data.url) {
                        resultData.fileUrl = result.data.url;
                        importService.downloadFile(result.data.url).then(function resolve(result) {
                            importService.processFile(result.data, savedImport.objectId).then(function (result) {
                                resultData = angular.extend(resultData, result);
                                savedImport.file = resultData.fileUrl;
                                resultData.import = savedImport;
                                deferred.resolve(resultData);
                            });
                        }, deferred.reject);
                    } else {
                        deferred.reject('file not uploaded');
                    }
                }, deferred.reject, function progress(evt) {
                });
            }, deferred.reject);



            return deferred.promise;
        };


        importService.uploadFile = function (file) {
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
        };


        importService.downloadFile = function (fileLocation) {
            return $http.get(fileLocation);
        };


        importService.processFile = function (file, dataset) {
            var deferred = $q.defer();
            var resultData = {};
            resultData.dataset = dataset;
            var dataArray = CSVToArray(file, ";");
            resultData.fileLines = dataArray.length;
            var promiseArrays = importService.batchRequestProcess(dataArray);
            resultData.processedRecords = promiseArrays.remote.length;
            $q.all(promiseArrays.remote).then(function (remoteImportResult) {
                resultData.remoteImportResult = remoteImportResult;
                $q.all(promiseArrays.local).then(function (localImportResult) {
                    resultData.localImportResult = localImportResult;
                    deferred.resolve(resultData);
                }, deferred.reject);
            }, deferred.reject);
            return deferred.promise;
        };

        function getEventFromData(dataArray) {
            //gly => 29
            //dateTime => 3                      
            var event = null;
            //blood glucose
            if (dataArray.length >= 29 && (dataArray[29] || dataArray[5]) && dataArray[3] && dataArray[0] !== "Index") {
                event = {};
                if (dataArray[29]) {
                    event.reading = parseInt(dataArray[29]);
                } else {
                    if (dataArray[5]) {
                        event.reading = parseInt(dataArray[5]);
                    }
                }
                event.dateTime = dateUtil.processDateTime(dataArray[3]);
                //TODO remove hard coded unit
                //mg/dL
                event.unit = {objectId: "0Erp4POX9d"};
                event.code = 1;
            } else {
                if (dataArray.length >= 29 && dataArray[10] && dataArray[11] && dataArray[3] && dataArray[0] !== "Index") {
                    event = {};
                    event.reading = parseInt(dataArray[11]);
                    event.dateTime = dateUtil.processDateTime(dataArray[3]);
                    //TODO remove hard coded unit
                    //u
                    event.unit = {objectId: "mGI1gkg1hF"};
                    event.code = 2;
                }
            }
            return event;
        }
        ;

        importService.singleRequestProcess = function (data) {
            var promiseArray = [];
            angular.forEach(data, function (line) {
                var event = getEventFromData(line);
                var promise = Event.save({}, event);
                if (promise) {
                    promiseArray.push(promise);
                }
            });
            return promiseArray;
        };

        importService.batchRequestProcess = function (data, importUUID) {
            var batchSize = 50;
            var promiseArrayRemote = [];
            var promiseArrayLocal = [];
            var batchData = [];
            for (var i in data) {
                var event = getEventFromData(data[i]);
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
        };


        // This will parse a delimited string into an array of
        // arrays. The default delimiter is the comma, but this
        // can be overriden in the second argument.
        function CSVToArray(strData, strDelimiter) {
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");
            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                    (
                            // Delimiters.
                            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                            // Quoted fields.
                            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                            // Standard fields.
                            "([^\"\\" + strDelimiter + "\\r\\n]*))"
                            ),
                    "gi"
                    );


            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [[]];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;


            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = objPattern.exec(strData)) {
                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];
                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push([]);
                }


                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[ 2 ]) {

                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    var strMatchedValue = arrMatches[ 2 ].replace(
                            new RegExp("\"\"", "g"),
                            "\""
                            );

                } else {

                    // We found a non-quoted value.
                    var strMatchedValue = arrMatches[ 3 ];

                }


                // Now that we have our value string, let's add
                // it to the data array.
                arrData[ arrData.length - 1 ].push(strMatchedValue);
            }

            // Return the parsed data.
            return(arrData);
        }
        return importService;
    }
})();