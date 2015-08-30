(function () {
    'use strict';

    angular.module('bloglu.engine')
            .factory('searchService', searchService);

    searchService.$inject = ['dataService', 'translationService', 'eventService', 'dateUtil', 'ResourceName', 'lunr'];


    function searchService(dataService, translationService, eventService, dateUtil, ResourceName, lunr) {
        
        var index = lunr(function () {            
            this.field('comment', {boost: 10});
            this.field('category.name', {boost: 2});
            this.ref('objectId');
        });


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
                        indexEvents(events);
                        /*
                        var foundEvents = events.filter(function (event) {
                            return eventSearchPredicate(event, searchTerm);
                        });
                        */
                       var searchResults = index.search(searchTerm);
                       var foundEvents = getSearchResults(events, searchResults);                       
                        return foundEvents;
                    });
        }
        
        
        function getSearchResults(events, foundEvents){
            return events.filter(function(event){
                return foundEvents.filter(function(foundEvent){
                    return foundEvent.ref === event.objectId;
                }).length === 1;
            });
        }
        
        
        function indexEvents(events){            
            events.forEach(function(event){
                index.add(event);
            });
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