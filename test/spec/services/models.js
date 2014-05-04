'use strict';

describe('Services: dataService', function() {

    // load the controller's module
    beforeEach(module('BloGlu'));

    var EventSvc;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(Event) {
        EventSvc = Event;
    }));
       
       /*
    it('should make right query', function() {
        var testResult = [{truc: "truc0.0", toto1: "value0.1", test: "testTest0.2", toto3: "value0.3"}, {truc: "truc0.1", toto1: "value1.1", test: "testTest0.2", toto3: "value1.3"}];
        var expectedResult = [{toto1: "value0.1", toto3: "value0.3"}, {toto1: "value1.1", toto3: "value1.3"}];
        var params = {
            select: [
                { field: 'toto1' },
                { field: 'toto3' }
            ]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });
    */
    




});

