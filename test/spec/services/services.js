'use strict';



describe('Services: dataService', function() {

    // load the controller's module
    beforeEach(module('BloGlu'));

    var dataServ;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(dataService) {
        dataServ = dataService;
    }));

    

    it('should select the rigth fields', function() {
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
    
        
    it('should transform the selection', function() {
        var testResult = [{truc: "truc0.0", toto1: "value0.1", test: "testTest0.2", toto3: "value0.3"}, {truc: "truc0.1", toto1: "value1.1", test: "testTest0.2", toto3: "value1.3"}];
        var expectedResult = [{toto1: "value0.1 truc0.0", toto3: "value0.3"}, {toto1: "value1.1 truc0.1", toto3: "value1.3"}];
        var params = {
            select: [
                { field: 'toto1',
                  transform: function(value, row){
                      return value + " " + row.truc;
                  }
                },
                { field: 'toto3' }
            ]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });
    
    
    it('should use aliases', function() {
        var testResult = [{truc: "truc0.0", toto1: "value0.1", test: "testTest0.2", toto3: "value0.3"}, {truc: "truc0.1", toto1: "value1.1", test: "testTest0.2", toto3: "value1.3"}];
        var expectedResult = [{field1: "value0.1 truc0.0", field2: "value0.3"}, {field1: "value1.1 truc0.1", field2: "value1.3"}];
        var params = {
            select: [
                { field: 'toto1',
                  transform: function(value, row){
                      return value + " " + row.truc;
                  },
                  alias: 'field1'
                },
                { 
                    field: 'toto3',
                    alias: 'field2'
                }
            ]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });
    
    it('should group by result', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: "4"}, 
            {truc: "1", toto1: "2", test: "3", toto3: "4"}];
        var expectedResult = [
            {field1: "2", field2: "4"}
            ];
        var params = {
            select: [
                { field: 'toto1',                  
                  alias: 'field1'
                },
                { 
                    field: 'toto3',
                    alias: 'field2'
                }
            ],
            groupBy:['field1', 'field2']
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });
    
    
    it('should do a sum and group by result', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: 4}, 
            {truc: "1", toto1: "2", test: "3", toto3: 4}];
        var expectedResult = [
            {field1: "2", field2: 8}
            ];
        var params = {
            select: [
                { field: 'toto1',                  
                  alias: 'field1'
                },
                { 
                    field: 'toto3',
                    aggregate: 'sum',
                    alias: 'field2'
                }
            ],
            groupBy:['field1']
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });
    
    
    
    
});



describe('Services: MessageService', function() {

    // load the controller's module
    beforeEach(module('BloGlu'));

    var messageService;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(MessageService) {
        messageService = MessageService;
    }));

    it('should return error message', function() {
        var errorMessage = messageService.errorMessage("completed", 2000);
        expect(errorMessage.type).toBe('error');
    });
});



describe('Services: dateUtil', function() {

    // load the controller's module
    beforeEach(module('BloGlu'));

    var dateUtilService;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(dateUtil) {
        dateUtilService = dateUtil;
    }));



    var testDate = new Date(2014, 4 - 1, 23);

    it('should return week period', function() {
        var period = dateUtilService.getDateWeekBeginAndEndDate(testDate, 0);

        expect(period.begin.getDate()).toBe(20);
        expect(period.begin.getMonth()).toBe(3);
        expect(period.begin.getFullYear()).toBe(2014);

        expect(period.end.getDate()).toBe(26);
        expect(period.end.getMonth()).toBe(3);
        expect(period.end.getFullYear()).toBe(2014);

    });

    it('should return month period', function() {
        var period = dateUtilService.getDateMonthBeginAndEndDate(testDate, 0);

        expect(period.begin.getDate()).toBe(1);
        expect(period.begin.getMonth()).toBe(3);
        expect(period.begin.getFullYear()).toBe(2014);

        expect(period.end.getDate()).toBe(30);
        expect(period.end.getMonth()).toBe(3);
        expect(period.end.getFullYear()).toBe(2014);

    });


    it('should return year period', function() {
        var period = dateUtilService.getDateYearBeginAndEndDate(testDate, 0);

        expect(period.begin.getDate()).toBe(1);
        expect(period.begin.getMonth()).toBe(0);
        expect(period.begin.getFullYear()).toBe(2014);

        expect(period.end.getDate()).toBe(31);
        expect(period.end.getMonth()).toBe(11);
        expect(period.end.getFullYear()).toBe(2014);

    });

    it('should check that period is on more than one day', function() {
        var testPeriods = [];
        var periodOnMoreThanOneDay = dateUtilService.arePeriodsOnMoreThanOneDay(testPeriods);

        expect(periodOnMoreThanOneDay).toBe(0);

        var zeroDate = new Date();
        zeroDate.setHours(0);
        zeroDate.setMinutes(0);

        testPeriods = [{
                begin: zeroDate,
                end: zeroDate
            }];

        periodOnMoreThanOneDay = dateUtilService.arePeriodsOnMoreThanOneDay(testPeriods);
        expect(periodOnMoreThanOneDay).toBe(0);

    });




});
