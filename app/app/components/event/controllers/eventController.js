(function () {
    'use strict';

    angular
            .module('bloglu.event')
            .controller('eventController', eventController);

    eventController.$inject = ['$q', '$rootScope', '$routeParams', '$window', 'categoryService', 'eventService', 'MessageService', 'ResourceCode', 'unitService', 'UserService', 'Utils'];

    function eventController(
            $q,
            $rootScope,
            $routeParams,            
            $window,
            categoryService,
            eventService,
            MessageService,
            ResourceCode,
            unitService,
            UserService,
            Utils) {

        
        var vm = this;
        
        vm.placeHolder = 100;        
        //init routeParams
        vm.objectId = vm.objectId || $routeParams.objectId;
        vm.day = vm.day || $routeParams.day;
        vm.time = vm.time || $routeParams.time;
        vm.isEdit = vm.objectId;
        vm.isPrefilledDateAndTime = vm.day && vm.time;
        var eventType = vm.eventType || $routeParams.eventType || 'other';
        //init scope params
        vm.windowMode = vm.windowMode || 'NORMAL';
        vm.eventCode = ResourceCode[eventType];
        vm.resourceName = ResourceCode[vm.eventCode];
        
        vm.changeUnit = changeUnit;
        vm.open = open;
        vm.updateEvent = updateEvent;
        vm.deleteEvent = deleteEvent;        
        
        renderPage();

        function renderPage() {            
            $rootScope.increasePending('processingMessage.synchronizing');
            $q.all([
                getEvent(),
                unitService.getUnitsByCode(vm.eventCode),
                categoryService.getCategoriesByCode(vm.eventCode),
                UserService.getDefaultUnit(vm.resourceName)
            ]).then(function (results) {
                vm.event = results[0];
                vm.units = results[1];
                vm.categories = results[2];
                vm.defaultUnit = results[3];

                handleDate();
                handleUnit();

            }, function () {
                $rootScope.messages.push(MessageService.errorMessage('errorMessage.loadingError', 2000));
            })['finally'](function () {
                $rootScope.decreasePending('processingMessage.synchronizing');
            });            
        }

        function handleDate() {
            //=====handle date
            var currentDate = new Date();
            if (vm.event.dateTime) {
                currentDate = vm.event.dateTime;
            }
            vm.date = currentDate;
        }

        function handleUnit() {
            //=====handle units
            if (!vm.event.unit) {
                if (vm.defaultUnit) {
                    vm.event.unit = vm.defaultUnit;
                } else {
                    if (vm.units.length > 0) {
                        vm.event.unit = vm.units[0];
                    }
                }
            }            
        }
        
        function changeUnit(newUnit, oldUnitId){            
            if(newUnit && (newUnit.objectId !== oldUnitId) && vm.event && vm.event.reading){
                unitService.getUnitById(oldUnitId).then(function(oldUnit){                    
                    vm.event.reading = vm.event.reading * oldUnit.coefficient / newUnit.coefficient;
                });
            }
        }
        
        

        function getEvent() {
            var deferred = $q.defer();
            if (vm.isEdit) {
                eventService.getEvent(vm.objectId).then(function (result) {
                    deferred.resolve(result);
                }, function (error) {
                    vm.isEdit = false;
                    deferred.reject(error);
                });
            } else {
                if (vm.isPrefilledDateAndTime) {
                    var rgbDate = new Date(vm.day);
                    var rgbTime = new Date(vm.time);

                    var newDate = new Date();
                    newDate.setFullYear(rgbDate.getFullYear());
                    newDate.setMonth(rgbDate.getMonth());
                    newDate.setDate(rgbDate.getDate());

                    newDate.setHours(rgbTime.getHours());
                    newDate.setMinutes(rgbTime.getMinutes());
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);
                    deferred.resolve({dateTime: newDate});
                } else {
                    deferred.resolve({});
                }
            }
            return deferred.promise;
        }

        function confirmAction() {
            switch (vm.windowMode) {
                case 'NORMAL':
                    $window.history.back();
                    break;
                case 'MODAL':
                    vm.$dismiss();
                    break;
                default:
                    break;
            }
        }

        function open($event) {
            $event.preventDefault();
            $event.stopPropagation();
            if (vm.opened) {
                vm.opened = false;
            } else {
                vm.opened = true;
            }

        };

        function updateEvent(event) {
            if (vm.isEdit) {
                $rootScope.increasePending("processingMessage.updatingData");
            } else {
                $rootScope.increasePending("processingMessage.savingData");
            }
            event.dateTime = vm.date;
            event.code = vm.eventCode;
            eventService.saveEvent(event, vm.isEdit).then(function resolve(result) {
                if (vm.isEdit) {
                    $rootScope.messages.push(MessageService.successMessage(eventService.resolveUpdateMessage(vm.eventCode), 2000));
                } else {
                    $rootScope.messages.push(MessageService.successMessage(eventService.resolveCreationMessage(vm.eventCode), 2000));
                }
                confirmAction();
            }, function (error) {
                if (vm.isEdit) {
                    $rootScope.messages.push(MessageService.errorMessage('errorMessage.updatingError', 2000));
                } else {
                    $rootScope.messages.push(MessageService.errorMessage('errorMessage.creatingError', 2000));
                }
            })['finally'](function () {
                if (vm.isEdit) {
                    $rootScope.decreasePending("processingMessage.updatingData");
                } else {
                    $rootScope.decreasePending("processingMessage.savingData");
                }
            });
        };

        function deleteEvent() {
            var modalScope = {
                confirmTitle: 'confirm.pageTitle',
                confirmMessage: 'confirm.deletionMessage',
                confirmYes: 'confirm.yes',
                confirmNo: 'confirm.no'
            };
            Utils.openConfirmModal(modalScope).then(function (confirmed) {
                if (confirmed) {
                    $rootScope.increasePending("processingMessage.deletingData");
                    eventService.deleteEvent(vm.event.objectId).then(function (result) {
                        confirmAction();
                    }, function (error) {
                        $rootScope.messages.push(MessageService.errorMessage('errorMessage.deletingError', 2000));
                    })['finally'](function () {
                        $rootScope.decreasePending("processingMessage.deletingData");
                    });
                }
            }, function () {
                //exit
            });
        };

        $rootScope.$on('dataReady', renderPage);
    }
})();