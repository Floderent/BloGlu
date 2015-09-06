(function () {
    'use strict';

    angular.module('bloglu.search')
            .factory('searchService', searchService);

    searchService.$inject = ['$q', 'dataService', 'translationService', 'eventService', 'dateUtil', 'ResourceName', 'lunr'];


    function searchService($q, dataService, translationService, eventService, dateUtil, ResourceName, lunr) {

        var searchService = {
            search: search,
            formatEventForDisplay: formatEventForDisplay,
            displayEventInModal: displayEventInModal
        };
        return  searchService;

        function search(searchTerm) {
            return dataService.init()
                    .then(function (localData) {
                        var events = localData['Event'];
                        return indexEvents(events, searchTerm);
                    });
        }

        function indexEvents(events, searchTerm) {

            return $q(function (resolve) {
                var worker = new Worker('app/shared/search/indexWorker.js');
                worker.addEventListener('message', function (e) {                    
                    resolve(e.data);
                }, false);

                worker.postMessage({
                    result: [],
                    searchTerm: searchTerm,
                    events: events
                });
            });

            /*
             events.forEach(function(event){                
             var eventToIndex = {
             comment: event.comment,
             categoryName: event.category && event.category.name,
             resourceName: translationService.translate(ResourceName[event.code]),
             month: dateUtil.getMonthName(event.dateTime),
             year: event.dateTime.getFullYear(),
             objectId: event.objectId
             };                
             index.add(eventToIndex);
             });
             */
        }


        function eventSearchPredicate(event, searchTerm) {
            var searchConditions = [
                //search term is in the comment
                event.comment && event.comment.indexOf(searchTerm) !== -1,
                //search term is in category name
                event.category && event.catagory.name && event.catagory.name.indexOf(searchTerm) !== -1,
                //search term is in the reading
                angular.isDefined(event.reading) && (event.reading + '').startsWith(searchTerm)
            ];

            var keepEvent = false;
            angular.forEach(searchConditions, function (searchCondition) {
                if (searchCondition) {
                    keepEvent = true;
                    return;
                }
            });
            return keepEvent;
        }



        function formatEventForDisplay(event) {
            var eventType, eventDate;
            if (event) {
                eventType = translationService.translate(ResourceName[event.code]);
                if (event.dateTime) {
                    eventDate = dateUtil.formatDateForDisplay(event.dateTime);
                }
            }
            return [eventType, eventDate].join(' ');
        }

        function displayEventInModal(event) {
            return eventService.viewEvent(event.code, event.objectId);
        }



    }

})();