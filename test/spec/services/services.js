'use strict';


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
    
    
    
    var testDate = new Date(2014,4-1,23);
    
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
    
    it('should check that period is on more than one day', function(){
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
