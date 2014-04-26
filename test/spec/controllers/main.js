'use strict';

describe('Controller: inputPeriodController', function() {

    // load the controller's module
    beforeEach(module('BloGlu'));    
    
    var inputPeriodController, scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function($controller, $rootScope) {
        scope = $rootScope.$new();
        inputPeriodController = $controller('inputPeriodController', {
            $scope: scope
        });
    }));
    
});
