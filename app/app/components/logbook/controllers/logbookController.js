(function () {
    'use strict';

    angular.module('bloglu.logbook')
            .controller('logBookController', logBookController);

    logBookController.$inject = ['menuHeaderService','$scope', '$state', '$stateParams', '$modal', 'eventService', 'ResourceIcon', 'ResourceName', 'logBookService', 'MessageService', 'printService'];


    function logBookController(menuHeaderService, $scope, $state, $stateParams, $modal, eventService, ResourceIcon, ResourceName, logBookService, MessageService, printService) {                
                
        var vm = this;
        
        vm.loadingState = menuHeaderService.loadingState;
        vm.data = [];
        vm.logBookTitle = '';
        vm.eventsTypes = ResourceName;
        vm.eventsIcons = ResourceIcon;
        vm.display = [1];
        vm.resource = {1: true};
        //default display blood glucose

        vm.currentDate = null;
        vm.interval = 'week';
        
        //functions
        //vm.changeResource = changeResource;
        vm.viewEvent = viewEvent;
        vm.printToPDF = printToPDF;
        vm.change = change;
        vm.addEvent = addEvent;
        vm.zoomInInterval = zoomInInterval;
        vm.advance = advance;
        vm.back = back;
        vm.currentWeek = currentWeek;        
        
        if ($stateParams && $stateParams.weekDate) {
            vm.currentDate = new Date($stateParams.weekDate);
        } else {
            vm.currentDate = new Date();
        }
        if ($stateParams && $stateParams.interval) {
            vm.interval = $stateParams.interval;
        }
        if ($stateParams && typeof $stateParams.display !== 'undefined') {
            vm.display = $stateParams.display;
            processDisplay();
        } 
        
        renderPage();
        
        /*
        function changeResource(){
            var resourceCodes = [];
            angular.forEach(vm.resource, function (value, key) {
                if (value) {
                    resourceCodes.push(parseInt(key));
                }
            });
            vm.display = resourceCodes;
            $location.url($location.path());
            $location.path('logBook').search('weekDate', vm.currentDate.toISOString()).search('interval', vm.interval).search('display', logBookService.getDisplayParam(vm.display));
        }
        */
        
        
        $scope.$watch('vm.resource', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                var resourceCodes = [];
                angular.forEach(newValue, function (value, key) {
                    if (value) {
                        resourceCodes.push(parseInt(key));
                    }
                });                
                vm.display = resourceCodes;                
                
                $state.go('logBook', {
                    weekDate: vm.currentDate.toISOString(),
                    interval: vm.interval,
                    display: logBookService.getDisplayParam(vm.display)
                },{reload:true});
            }
        }, true);
        

        

        function renderPage() {
            menuHeaderService.increasePending("processingMessage.loadingData");
            logBookService.getTimeInterval(vm.interval, vm.currentDate).then(function (timeInterval) {
                vm.timeInterval = timeInterval;
                vm.logBookTitle = logBookService.getTimeIntervalTitle(timeInterval);
                var params = {where: {code: {$in: vm.display}}};
                logBookService.getTableData(vm.timeInterval, params).then(
                        function (result) {
                            vm.header = result[0];
                            vm.data = result;
                        },
                        function (error) {
                            MessageService.errorMessage("errorMessage.loadingError", 2000);
                            vm.header = [];
                            vm.data = [];
                        })['finally'](function () {
                    menuHeaderService.decreasePending("processingMessage.loadingData");
                });
            });
        }

        function processDisplay() {
            var intStrArray = vm.display.split(',');
            var intArray = [];
            var resource = {};
            angular.forEach(intStrArray, function (value, key) {
                if (parseInt(value) === parseInt(value)) {
                    intArray.push(parseInt(value));
                    resource[parseInt(value)] = true;
                }
            });
            vm.resource = resource;
            vm.display = intArray;
        }


        function changeInterval(currentDate, interval, coef) {
            var newDate = new Date(currentDate.getTime());
            switch (interval) {
                case 'day':
                    newDate.setDate(newDate.getDate() + (1 * coef));
                    break;
                case 'week':
                    newDate.setDate(newDate.getDate() + (7 * coef));
                    break;
                case 'month':
                    newDate.setMonth(newDate.getMonth() + (1 * coef));
                    break;
                case 'year':
                    newDate.setFullYear(newDate.getFullYear() + (1 * coef));
                    break;
            }
            vm.currentDate = newDate;            
            
            $state.go('logBook', {
                    weekDate: vm.currentDate.toISOString(),
                    interval: interval,
                    display: logBookService.getDisplayParam(vm.display)
                },{
                    reload: true
                });
        }

        //view reading by id
        function viewEvent(code, objectId) {
            eventService.viewEvent(code, objectId).then(renderPage, renderPage);
        }

        function printToPDF() {
            return printService.printLogBook(vm.data, vm.timeInterval, vm.display);
        }

        /**
         * Change grouping
         */
        function change() {
            changeInterval(vm.currentDate, vm.interval, 0);
        };

        //create new reading with prefilled date and time
        function addEvent(day, period) {
            //if only one event type selected, add this one            
            if (vm.display.length === 1) {
                eventService.goToAddEvent(vm.display[0], day, period).then(renderPage, renderPage);
            } else {
                //display modal window to choose the type of event
                var $modalScope = $rootScope.$new(true);
                $modalScope.eventsTypes = logBookService.getEventTypes(vm.display);
                var modalInstance = $modal.open({
                    templateUrl: "app/components/logbook/templates/chooseEvent.html",
                    controller: "chooseEventController as vm",
                    scope: $modalScope,
                    resolve: {
                        confirmed: function () {
                            return vm.code;
                        }
                    }
                });
                modalInstance.result.then(function (eventCode) {
                    if (angular.isDefined(eventCode)) {
                        eventService.goToAddEvent(eventCode, day, period).then(renderPage, renderPage);
                    }
                }, function () {
                    //exit
                });
            }
        };


        function zoomInInterval(date) {
            var newInterval = '';
            switch (vm.interval) {
                case 'month':
                    newInterval = 'week';
                    break;
                case 'year':
                    newInterval = 'month';
                    break;
                default:
                    newInterval = vm.interval;
                    break;
            }            
            
            $state.go('logBook',{
               weekDate: date.toISOString(),
               interval: newInterval
            },{reload:true});
        }

        function advance() {
            changeInterval(vm.currentDate, vm.interval, +1);
        }

        function back() {
            changeInterval(vm.currentDate, vm.interval, -1);
        }

        function currentWeek() {
            vm.currentDate = new Date();
            changeInterval(vm.currentDate, vm.interval, 0);
        }
        
        var unbind = $scope.$on('dataReady', renderPage);
        $scope.$on('destroy', unbind);
    }
})();