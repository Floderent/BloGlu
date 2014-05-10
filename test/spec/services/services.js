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
                {field: 'toto1'},
                {field: 'toto3'}
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
                {field: 'toto1',
                    transform: function(value, row) {
                        return value + " " + row.truc;
                    }
                },
                {field: 'toto3'}
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
                {field: 'toto1',
                    transform: function(value, row) {
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
                {field: 'toto1',
                    alias: 'field1'
                },
                {
                    field: 'toto3',
                    alias: 'field2'
                }
            ],
            groupBy: ['field1', 'field2']
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
                {field: 'toto1',
                    alias: 'field1'
                },
                {
                    field: 'toto3',
                    aggregate: 'sum',
                    alias: 'field2'
                }
            ],
            groupBy: ['field1']
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });


    it('should do a count and group by result', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: 4},
            {truc: "1", toto1: "2", test: "3", toto3: 4},
            {truc: "2", toto1: "4", test: "3", toto3: 4}
        ];
        var expectedResult = [
            {field1: "2", field2: 2},
            {field1: "4", field2: 1}
        ];
        var params = {
            select: [
                {field: 'toto1',
                    alias: 'field1'
                },
                {
                    field: 'toto3',
                    aggregate: 'count',
                    alias: 'field2'
                }
            ],
            groupBy: ['field1']
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });

    it('should do an average and group by result', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: 4},
            {truc: "1", toto1: "2", test: "3", toto3: 1},
            {truc: "2", toto1: "4", test: "3", toto3: 4}
        ];
        var expectedResult = [
            {toto1: "2", toto3: 2.5},
            {toto1: "4", toto3: 4}
        ];
        var params = {
            select: [
                {field: 'toto1'
                },
                {
                    field: 'toto3',
                    aggregate: 'avg'
                }
            ],
            groupBy: ['toto1']
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });

    it('should filter the result', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: 4},
            {truc: "1", toto1: "2", test: "3", toto3: 1},
            {truc: "2", toto1: "4", test: "3", toto3: 4}
        ];
        var expectedResult = [
            {toto1: "2", toto3: 1}            
        ];
        var params = {
            select: [
                {field: 'toto1'},
                {field: 'toto3'}
            ],
            where: {
                toto3: 1
            }
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });
    
    
    it('should filter the result with $in operator', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: 4},
            {truc: "1", toto1: "2", test: "3", toto3: 1},
            {truc: "1", toto1: "99", test: "3", toto3: 2},
            {truc: "2", toto1: "4", test: "3", toto3: 4}
        ];
        var expectedResult = [
            {toto1: "2", toto3: 1},
            {toto1: "99", toto3: 2}
        ];
        var params = {
            select: [
                {field: 'toto1'},
                {field: 'toto3'}
            ],
            where: {
                toto3: {$in:[1,2]}
            }
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });
    
    
    it('should filter between date', function() {
        var testResult = [
            {name: "test1", dateTime: new Date(2010,1,1)},
            {name: "test2", dateTime: new Date(2010,3,1)},
            {name: "test3", dateTime: new Date(2010,5,1)},
            {name: "test4", dateTime: new Date(2011,3,1)}
        ];
        var expectedResult = [
            {name: "test1", dateTime: new Date(2010,1,1)},
            {name: "test2", dateTime: new Date(2010,3,1)}
        ];
        var params = {
            select: [
                {field: 'name'},
                {field: 'dateTime'}
            ],
            where: {
                dateTime: {$gt:new Date(2010,1,1),$lt:new Date(2010,3,2)}
            }
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



describe('Services: indexeddbService', function() {

    // load the controller's module
    beforeEach(module('BloGlu'));

    var indexeddb;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(indexeddbService) {
        indexeddb = indexeddbService;
    }));


    it('should open the database without error, insert a record, retrieve it and delete id', function() {
        console.log('Testing indexedDB');
        var testRecord = {objectId: 'test1', description: 'test object'};
        var collectionName = 'Event';
        indexeddb.addRecord(collectionName, testRecord).then(function resolve(result) {
            console.log('Adding indexedDB record');
            expect('addRecordSuccess').toBe('addRecordSuccess');
            indexeddb.getData(collectionName).then(function resolve(result) {
                console.log('Retrieving indexedDB data');
                expect('getDataSuccess').toBe('getDataSuccess');

                var testRecord = null;
                result.forEach(function(record) {                    
                    if (record.objectId === testRecord.objectId && record.description === testRecord.description) {
                        testRecord = record;
                    }
                });
                console.log('Testing indexedDB data');
                expect(testRecord).toBe(testRecord);

                indexeddb.deleteRecord(testRecord.objectId).then(function resolve(result) {
                    console.log('Deleting indexedDB data');
                    expect('deleteRecordSuccess').toBe('deleteRecordSuccess');
                }, function reject(error) {
                    console.log(error);
                    expect('deleteRecordError').toBe('deleteRecordSuccess');
                });

            }, function reject(error) {
                console.log(error);
                expect('getDataError').toBe('getDataSuccess');
            });

        }, function reject(error) {
            console.log(error);
            expect('addRecordError').toBe('addRecordSuccess');
        });

    });


});


