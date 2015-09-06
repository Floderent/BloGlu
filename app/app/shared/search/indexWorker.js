(function ()
{
  self.importScripts
  ( '../../../bower_components/lunr.js/lunr.min.js',
    '../../../bower_components/lunr-languages/lunr.stemmer.support.js',
    '../../../bower_components/lunr-languages/lunr.fr.js');
  
  var index = lunr(function () {
    this.use(lunr.fr);
    this.field('comment', {boost: 10});
    this.field('categoryName', {boost: 2});
    this.field('resourceName', {boost: 5});
    this.field('month', {boost: 2});
    this.field('year', {boost: 2});
    this.ref('objectId');
  });
  
  function indexData(searchData) {

    var result = searchData.result;
    var searchTerm = searchData.searchTerm;
    var events = searchData.events;

    events.forEach(function (event) {
        var eventToIndex = {
            comment: event.comment,
            categoryName: event.category && event.category.name,
            year: event.dateTime.getFullYear(),
            objectId: event.objectId
        };
        index.add(eventToIndex);
    });

    var searchResults = index.search(searchTerm);
    return getSearchResults(events, searchResults);
}

function getSearchResults(events, foundEvents) {
    return events.filter(function (event) {
        return foundEvents.filter(function (foundEvent) {
            return foundEvent.ref === event.objectId;
        }).length === 1;
    });
}
  
  
  
  self.addEventListener('message', function (e) {
    self.postMessage(indexData(e.data));
}, false);

}());