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


    it('should select sub-object fields', function() {
        var testResult = [{truc: "truc0.0", toto1: {name: 'totoRow1'}, test: "testTest0.2", toto3: "value0.3"}, {truc: "truc0.1", toto1: {name: 'totoRow2'}, test: "testTest0.2", toto3: "value1.3"}];
        var expectedResult = [{'toto1.name': 'totoRow1', toto3: "value0.3"}, {'toto1.name': "totoRow2", toto3: "value1.3"}];
        var params = {
            select: [
                {field: 'toto1.name'},
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
            {field1: "2", field2: '8.00'}
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


    it('should do a sum with only one field', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: 4},
            {truc: "1", toto1: "2", test: "3", toto3: 4}];
        var expectedResult = [
            {field2: '8.00'}
        ];
        var params = {
            select: [
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

    it('should do a sum with only one field and no group by', function() {
        var testResult = [
            {truc: "1", toto1: "2", test: "3", toto3: 4},
            {truc: "1", toto1: "2", test: "3", toto3: 4}];
        var expectedResult = [
            {field2: '8.00'}
        ];
        var params = {
            select: [
                {
                    field: 'toto3',
                    aggregate: 'sum',
                    alias: 'field2'
                }
            ]//,
                    //groupBy: ['field1']
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
            {field1: "2", field2: '2'},
            {field1: "4", field2: '1'}
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
            {toto1: "2", toto3: '2.50'},
            {toto1: "4", toto3: '4.00'}
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


    it('should do several averages on same column', function() {
        var testResult = [
            {truc: "1", toto1: 3, test: "3", toto3: 4},
            {truc: "1", toto1: 2, test: "3", toto3: 1},
            {truc: "2", toto1: 4, test: "3", toto3: 4},
            {truc: "2", toto1: 10, test: "3", toto3: 4},
            {truc: "3", toto1: 20, test: "3", toto3: 4},
            {truc: "3", toto1: 30, test: "3", toto3: 4}
        ];
        var expectedResult = [
            {avg1: '2.50', avg2: '7.00', avg3: '25.00'}
        ];
        var params = {
            select: [
                {
                    field: 'toto1',
                    aggregate: 'avg',
                    alias: 'avg1',
                    transform: function(value, row) {
                        var returnValue = null;
                        if (row.truc === "1") {
                            returnValue = value;
                        }
                        return returnValue;
                    }
                },
                {
                    field: 'toto1',
                    aggregate: 'avg',
                    alias: 'avg2',
                    transform: function(value, row) {
                        var returnValue = null;
                        if (row.truc === "2") {
                            returnValue = value;
                        }
                        return returnValue;
                    }
                },
                {
                    field: 'toto1',
                    aggregate: 'avg',
                    alias: 'avg3',
                    transform: function(value, row) {
                        var returnValue = null;
                        if (row.truc === "3") {
                            returnValue = value;
                        }
                        return returnValue;
                    }
                }
            ]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });


    it('should do several averages on same column without displaying NaN', function() {
        var testResult = [
            {truc: "1", toto1: 3, test: "janvier", toto3: null},
            {truc: "1", toto1: 2, test: "janvier", toto3: null},
            {truc: "2", toto1: null, test: "fevrier", toto3: 4},
            {truc: "2", toto1: 10, test: "juin", toto3: 4}
        ];
        var expectedResult = [
            {test: "janvier", avg1: '2.50', avg2: '0.00'},
            {test: "fevrier", avg1: '0.00', avg2: '0.00'},
            {test: "juin", avg1: '0.00', avg2: '10.00'}
        ];
        var params = {
            select: [
                {
                    field: 'test'
                },
                {
                    field: 'toto1',
                    aggregate: 'avg',
                    alias: 'avg1',
                    transform: function(value, row) {
                        var returnValue = null;
                        if (row.truc === "1") {
                            returnValue = value;
                        }
                        return returnValue;
                    }
                },
                {
                    field: 'toto1',
                    aggregate: 'avg',
                    alias: 'avg2',
                    transform: function(value, row) {
                        var returnValue = null;
                        if (row.truc === "2") {
                            returnValue = value;
                        }
                        return returnValue;
                    }
                }

            ],
            groupBy: ['truc', 'test']
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
                toto3: {$in: [1, 2]}
            }
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });

    //Date {Sun Dec 01 2013 00:00:00 GMT+0100}
    //Date {Tue Dec 31 2013 00:00:00 GMT+0100}


    it('should filter between date', function() {
        var testResult = [
            {name: "test1", dateTime: new Date(2010, 1, 1)},
            {name: "test2", dateTime: new Date(2010, 3, 1)},
            {name: "test3", dateTime: new Date(2010, 5, 1)},
            {name: "test4", dateTime: new Date(2011, 3, 1)}
        ];
        var expectedResult = [
            {name: "test1", dateTime: new Date(2010, 1, 1)},
            {name: "test2", dateTime: new Date(2010, 3, 1)}
        ];
        var params = {
            select: [
                {field: 'name'},
                {field: 'dateTime'}
            ],
            where: {
                dateTime: {$gt: new Date(2010, 1, 1), $lt: new Date(2010, 4, 31)}
            }
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });

    it('should order the result', function() {
        var testResult = [
            {name: "test1", value: 0},
            {name: "test8", value: 8},
            {name: "test4", value: 4},
            {name: "test0", value: -1}
        ];
        var expectedResult = [
            {name: "test0", value: -1},
            {name: "test1", value: 0},
            {name: "test4", value: 4},
            {name: "test8", value: 8}
        ];
        var params = {
            select: [
                {field: 'name'},
                {field: 'value'}
            ],
            orderBy: [{
                    alias: 'value'
                }]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });


    it('should order the result by descending order', function() {
        var testResult = [
            {name: "test1", value: 0},
            {name: "test8", value: 8},
            {name: "test4", value: 4},
            {name: "test0", value: -1}
        ];
        var expectedResult = [
            {name: "test8", value: 8},
            {name: "test4", value: 4},
            {name: "test1", value: 0},
            {name: "test0", value: -1}
        ];
        var params = {
            select: [
                {field: 'name'},
                {field: 'value'}
            ],
            orderBy: [{
                    alias: 'value',
                    direction: 'desc'
                }]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });


    it('should order the result by multiple columns', function() {
        var testResult = [
            {name: "aaa", value: 8},
            {name: "bb", value: 4},
            {name: "zzz", value: -1},
            {name: "aaa", value: 0}
        ];
        var expectedResult = [
            {name: "aaa", value: 0},
            {name: "aaa", value: 8},
            {name: "bb", value: 4},
            {name: "zzz", value: -1}
        ];
        var params = {
            select: [
                {field: 'name'},
                {field: 'value'}
            ],
            orderBy: [{
                    alias: 'name'
                }
                , {
                    alias: 'value'
                }]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });


    it('should order the result by custom sorting function', function() {
        var testResult = [
            {name: "February", value: 8},
            {name: "January", value: 4},
            {name: "December", value: -1},
            {name: "July", value: 0}
        ];
        var expectedResult = [
            {name: "January", value: 4},
            {name: "February", value: 8},
            {name: "July", value: 0},
            {name: "December", value: -1}
        ];
        var params = {
            select: [
                {field: 'name'},
                {field: 'value'}
            ],
            orderBy: [{
                    alias: 'name',
                    sort: dataServ.sort.monthName
                }
            ]
        };
        var processedResult = dataServ.processResult(testResult, params);
        expect(processedResult).toEqual(expectedResult);
    });






});


describe('Services: queryService', function() {

    beforeEach(module('BloGlu'));
    var querySvc;
    var scope;
    beforeEach(inject(function($injector) {
        querySvc = $injector.get('queryService');
        scope = $injector.get('$rootScope');
    }));

    var testReportQuery = {
        select: ['month', 'averageBgReading'],
        where: {code: 1}
    };


});

/*
 
 */

describe('Services: ModelUtil', function() {

    // load the controller's module
    beforeEach(module('BloGlu'));

    var modelUtil;

    // Initialize the controller and a mock scope
    beforeEach(inject(function(ModelUtil) {
        modelUtil = ModelUtil;
    }));

    var testWhere = {
        where: {
            code: 1,
            dateTime: {type: 'function', value: 'getCurrentYearParseFilter'}
        }
    };

    var testAdditionnalWhere = {
        where: {code: 2}

    };
    var expected = {
        code: {$in: [1, 2]},
        dateTime: {type: 'function', value: 'getCurrentYearParseFilter'}
    };

    it('should add clause to where expression', function() {
        var generatedWhere = modelUtil.addClauseToFilter(testWhere.where, testAdditionnalWhere.where);
        expect(generatedWhere.code[0]).toBe(expected.code[0]);
        expect(generatedWhere.code[1]).toBe(expected.code[1]);
        expect(generatedWhere.dateTime.type).toBe(expected.dateTime.type);
        expect(generatedWhere.dateTime.function).toBe(expected.dateTime.function);
    });


    var nowDate = new Date();



    it('should transform data to parse format', function() {

        var data = {
            date: nowDate,
            unit: {objectId: 'toto'},
            date2: nowDate,
            otherObject: {objectId: 'titi'}
        };


        var transformedData = modelUtil.transformToParseFormat(data, [
            {field: 'date', type: 'date'},
            {field: 'unit', type: 'pointer', className: 'Unit'},
            {field: 'date2', type: 'date'},
            {field: 'otherObject', type: 'pointer', className: 'OtherObject'}
        ]);

        expect(transformedData.date.__type).toBe('Date');
        expect(transformedData.date.iso).toBe(nowDate.toISOString());

        expect(transformedData.date2.__type).toBe('Date');
        expect(transformedData.date2.iso).toBe(nowDate.toISOString());

        expect(transformedData.unit.__type).toBe('Pointer');
        expect(transformedData.unit.className).toBe('Unit');
        expect(transformedData.unit.objectId).toBe('toto');

        expect(transformedData.otherObject.__type).toBe('Pointer');
        expect(transformedData.otherObject.className).toBe('OtherObject');
        expect(transformedData.otherObject.objectId).toBe('titi');

    });





    it('should not crash with null date', function() {
        var data = {
            date: null
        };
        
        var transformedData = modelUtil.transformToParseFormat(data, [
            {field: 'date', type: 'date'}
        ]);
        expect(transformedData.date).toBe(null);
        
        data = {};
        transformedData = modelUtil.transformToParseFormat(data, [
            {field: 'date', type: 'date'}
        ]);        
        expect(transformedData.date).toBe(undefined);
        
    });
    
    it('should convert date to normal format', function() {
        var data = {
            "dateTime":{"__type":"Date","iso":"2014-06-14T13:36:46.355Z"}
        };
        
        var transformedData = modelUtil.transformToNormalFormat(data, [
            {field: 'dateTime', type: 'date'}
        ]);
        expect(transformedData.dateTime.getFullYear()).toBe(2014);        
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
        expect(periodOnMoreThanOneDay).toBe(1);

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
            done();
        });

    }, 15000);


});