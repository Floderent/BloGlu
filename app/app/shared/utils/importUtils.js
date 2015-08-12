(function () {
    'use strict';

    angular.module('bloglu.utils')
            .factory('importUtils', importUtils);

    importUtils.$inject = ['dateUtil', 'ResourceCode'];
            
    function importUtils(dateUtil, ResourceCode) {

        var dataFormats = [
             {
                name: 'careLink',
                supportedEvents: [
                    ResourceCode.bloodGlucose,
                    ResourceCode.medication
                ],
                getEventFromData: function (dataArray) {
                    //gly => 29
                    //dateTime => 3                      
                    var event = null;
                    //blood glucose
                    if (dataArray.length >= 29 && (dataArray[29] || dataArray[5]) && dataArray[3] && dataArray[0] !== 'Index') {
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
                        event.unit = {objectId: '0Erp4POX9d'};
                        event.code = 1;
                    } else {
                        if (dataArray.length >= 29 && dataArray[10] && dataArray[11] && dataArray[3] && dataArray[0] !== 'Index') {
                            event = {};
                            event.reading = parseInt(dataArray[11]);
                            event.dateTime = dateUtil.processDateTime(dataArray[3]);
                            //TODO remove hard coded unit
                            //u
                            event.unit = {objectId: 'mGI1gkg1hF'};
                            event.code = 2;
                        }
                    }
                    return event;
                }
            }
        ];



        var service = {
            CSVToArray: CSVToArray,
            dataFormats: dataFormats
        };
        return service;


        // This will parse a delimited string into an array of
        // arrays. The default delimiter is the comma, but this
        // can be overriden in the second argument.
        function CSVToArray(strData, strDelimiter) {
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");
            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp((
                    // Delimiters.
                    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
                    // Quoted fields.
                    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
                    // Standard fields.
                    "([^\"\\" + strDelimiter + "\\r\\n]*))"
                    ), "gi");


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
                if (strMatchedDelimiter.length && (strMatchedDelimiter !== strDelimiter)) {
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
                    var strMatchedValue = arrMatches[ 2 ].replace(new RegExp("\"\"", "g"), "\"");
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



    }


})();


