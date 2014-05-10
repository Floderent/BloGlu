"use strict";
var ControllersModule = angular.module("BloGlu.controllers", []);

ControllersModule.controller('confirmModalController', ['$scope', '$modalInstance', function Controller($scope, $modalInstance) {
        $scope.ok = function() {
            $modalInstance.close(1);
        };
        $scope.cancel = function() {
            $modalInstance.dismiss(0);
        };
    }]);

ControllersModule.controller('eventController', ['$scope', '$rootScope', '$routeParams', '$q', '$window', '$modal','ResourceCode', 'dateUtil', 'Unit', 'UserService', 'MessageService', 'Event', function Controller($scope, $rootScope, $routeParams, $q, $window, $modal, ResourceCode, dateUtil, Unit, UserService, MessageService, Event) {
        $rootScope.messages = [];
        $rootScope.pending = 0;

        $scope.placeHolder = 100;
        $scope.unitDisabled = true;

        $scope.isEdit = $routeParams && $routeParams.objectId;
        var isPrefilledDateAndTime = $routeParams && $routeParams.day && $routeParams.time;
        
        var eventType = 'other';
        if($routeParams.eventType){
            eventType = $routeParams.eventType;
        }         
        $scope.eventCode = ResourceCode[eventType];
        
        $rootScope.pending++;
        $q.all([
            getEvent(),
            Unit.query({where:JSON.stringify({code: $scope.eventCode})}).$promise
        ]).then(function resolve(results) {
            $rootScope.pending--;
            $scope.event = results[0];            
            $scope.units = results[1];
            //=====handle date
            var currentDate = new Date();
            if ($scope.event.dateTime) {
                currentDate = $scope.event.dateTime;
            } else {
                if ($scope.event.dateTime) {
                    currentDate = $scope.event.dateTime;
                }
            }
            $scope.date = currentDate;

            //=====handle units
            if ($scope.event.unit) {
                $scope.units.forEach(function(unit) {
                    if (unit.objectId === $scope.event.unit.objectId) {
                        $scope.currentUnit = unit;
                    }
                });
            } else {
                if (UserService.currentUser().preferences && UserService.currentUser().preferences.defaultUnit) {
                    $scope.units.forEach(function(unit) {
                        if (unit.objectId === UserService.currentUser().preferences.defaultUnit.objectId) {
                            $scope.currentUnit = unit;
                            return;
                        }
                    });
                } 
                if(!$scope.currentUnit && $scope.units.length > 0){
                    $scope.currentUnit = $scope.units[0];
                }
            }
            $scope.$watch('currentUnit', function(newValue, oldValue) {
                if (newValue && oldValue) {
                    if ($scope.event && $scope.event.reading) {
                        $scope.event.reading = $scope.event.reading * oldValue.coefficient / newValue.coefficient;
                    } else {
                        $scope.placeHolder = $scope.placeHolder * oldValue.coefficient / newValue.coefficient;
                    }
                }
            });
        }, function reject() {
            $rootScope.pending--;
            $rootScope.messages.push(MessageService.errorMessage('Cannot read informations from server', 2000));
        });

        $scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };

        function getEvent() {
            $rootScope.pending++;
            var deferred = $q.defer();
            if ($scope.isEdit) {
                Event.get({Id: $routeParams.objectId, include: "unit"}, function(result) {                    
                    $rootScope.pending--;
                    deferred.resolve(result);
                }, function(error) {
                    $scope.isEdit = false;
                    deferred.reject(error);
                });
            } else {
                if (isPrefilledDateAndTime) {
                    var rgbDate = new Date($routeParams.day);
                    var rgbTime = new Date($routeParams.time);

                    var newDate = new Date();
                    newDate.setFullYear(rgbDate.getFullYear());
                    newDate.setMonth(rgbDate.getMonth());
                    newDate.setDate(rgbDate.getDate());

                    newDate.setHours(rgbTime.getHours());
                    newDate.setMinutes(rgbTime.getMinutes());
                    newDate.setSeconds(0);
                    newDate.setMilliseconds(0);
                    $rootScope.pending--;
                    deferred.resolve({dateTime: newDate});
                } else {
                    $rootScope.pending--;
                    deferred.resolve({});
                }
            }
            return deferred.promise;
        }

        $scope.update = function(event) {
            event.dateTime = $scope.date;
            event.unit = $scope.currentUnit;
            event.code = $scope.eventCode;
            var savingPromise = null;
            if ($scope.isEdit) {
                savingPromise = Event.update({'Id': event.objectId}, event).$promise;
            } else {
                savingPromise = Event.save({}, event).$promise;
            }
            savingPromise.then(function resolve(result) {
                $rootScope.messages.push(MessageService.successMessage('Blood glucose reading saved', 2000));
            }, function reject(error) {
                $rootScope.messages.push(MessageService.errorMessage('Problem saving blood glucose reading', 2000));
            });

        };

        $scope.delete = function() {
            var modalInstance = $modal.open({
                templateUrl: "views/modal/confirm.html",
                controller: "confirmModalController",
                resolve: {
                    confirmed: function() {
                        return $scope.confirmed;
                    }
                }
            });
            modalInstance.result.then(function(confirmed) {
                if (confirmed) {
                    Event.delete({"Id": $scope.event.objectId}).$promise.then(function(result) {
                        $window.history.back();
                    }, function(error) {
                        $rootScope.messages.push(MessageService.errorMessage("Problem deleting blood glucose reading", 2000));
                    });
                }
            }, function() {
                //exit
            });
        };

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            //clear messages
            $rootScope.messages = [];
        });


    }]);



ControllersModule.controller('inputUserController', ['$scope', '$rootScope', '$modalInstance', 'UserService', 'MessageService', function Controller($scope, $rootScope, $modalInstance, UserService, MessageService) {
        $scope.user = {};
        $scope.cancel = function() {
            $modalInstance.dismiss('canceled');
        };
        $scope.creatingUser = false;

        $scope.signUp = function() {
            $scope.successMessage = null;
            $scope.erroMessage = null;
            $scope.creatingUser = true;
            UserService.signUp($scope.user)
                    .success(function(result) {
                        $scope.creatingUser = false;
                        $rootScope.messages.push(MessageService.successMessage('User successfully created', 2000));
                        $scope.cancel();
                    })
                    .error(function(error) {
                        $scope.erroMessage = error.error;
                        $scope.creatingUser = false;
                    });
        };
        $scope.hitEnter = function(evt) {
            if (angular.equals(evt.keyCode, 13) && $scope.user) {
                if (!((angular.equals($scope.user.username, null) || angular.equals($scope.user.username, '')) && (angular.equals($scope.user.password, null) || angular.equals($scope.user.password, '')))) {
                    $scope.signUp();
                }
            }
        };
    }]);


ControllersModule.controller('chartController', ['$rootScope', '$scope', '$routeParams', '$location', 'MessageService', 'chartService', 'overViewService', function Controller($rootScope, $scope, $routeParams, $location, MessageService, chartService, overViewService) {

        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.interval = 'month';

        var interval = overViewService.getTimeInterval($scope.interval, new Date());
        $scope.beginDate = interval.begin;
        $scope.endDate = interval.end;

        $scope.openBeginDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.beginDateOpened = true;
        };
        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.endDateOpened = true;
        };


        if ($routeParams && $routeParams.beginDate && $routeParams.endDate) {
            $scope.beginDate = new Date($routeParams.beginDate);
            $scope.endDate = new Date($routeParams.endDate);
        }

        if ($routeParams && $routeParams.interval) {
            $scope.interval = $routeParams.interval;
        }

        $scope.toggleLoading = function() {
            this.chartConfig.loading = !this.chartConfig.loading;
        };

        $scope.change = function() {
            $location.path('charts')
                    .search('interval', $scope.interval)
                    .search('beginDate', $scope.beginDate)
                    .search('endDate', $scope.endDate)
                    ;
        };


        $scope.chartConfig = {
            options: {
                chart: {
                    type: 'line',
                    zoomType: 'x'
                }
            },
            series: [{
                    data: []
                }],
            title: {
                text: 'Blood Glucose over time'
            },
            xAxis: {
                /*
                 type: 'datetime',
                 dateTimeLabelFormats: {// don't display the dummy year
                 month: '%e. %b',
                 year: '%b'
                 }*/
            },
            loading: false
        };
        $rootScope.pending++;
        chartService.getChartAggregatedDataSeries($scope.beginDate, $scope.endDate, $scope.interval, false).then(function(chartSeries) {
            $scope.chartConfig.series = chartSeries.series;
            $scope.chartConfig.xAxis.categories = chartSeries.axisLabels;
            $rootScope.pending--;
        });




        /*
         $scope.data = [];
         $rootScope.pending++;
         overViewService.getTableData($scope.timeInterval).then(
         function resolve(result) {
         $rootScope.pending--;
         $scope.header = result[0];
         $scope.data = result;
         },
         function reject(error) {
         $rootScope.pending--;
         $scope.header = [];
         $scope.data = [];
         });
         
         
         
         
         $rootScope.pending++;
         $q.all([
         //ReadingGlucoseBlood.query({order: "dateTime", include: "unit"}).$promise,
         overViewService.getTableData($scope.timeInterval),
         BloodGlucoseTarget.query({include: "unit"}).$promise
         ]).then(function(results) {
         //$scope.chartConfig.series[0].data = chartService.getGlucoseReadingData(results[0]);
         
         var chartSeries = chartService.getChartDataSeriesFromAggregatedData(results[0]);            
         $scope.chartConfig.series = chartSeries;
         
         
         if (results[1] && results[1].length > 0) {
         var target = results[1][0];
         $scope.chartConfig.yAxis = {
         plotBands: [{// Light air
         from: target.lowerLevel * target.unit.coefficient,
         to: target.upperLevel * target.unit.coefficient,
         color: 'rgba(68, 170, 213, 0.1)',
         label: {
         text: 'Target',
         style: {
         color: '#606060'
         }
         }
         }]
         };
         }
         $rootScope.pending--;
         });
         */


        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            //clear messages
            $rootScope.messages = [];
        });



    }]);



ControllersModule.controller('resetPasswordController', ['$scope', '$modalInstance', 'UserService', function Controller($scope, $modalInstance, UserService) {
        $scope.cancel = function() {
            $modalInstance.dismiss('canceled');
        };
        $scope.resettingPassword = false;
        $scope.resetPassword = function(email) {
            $scope.successMessage = null;
            $scope.erroMessage = null;
            $scope.resettingPassword = true;
            UserService.requestPasswordReset(email)
                    .success(function(result) {
                        $scope.successMessage = 'Password reset';
                        $scope.resettingPassword = false;
                    })
                    .error(function(error) {
                        $scope.erroMessage = error.error;
                        $scope.resettingPassword = false;
                    });
        };
    }]);


ControllersModule.controller('inputPeriodController', ['$rootScope', '$scope', '$modal', 'dateUtil', 'Period', 'MessageService', function Controller($rootScope, $scope, $modal, dateUtil, Period, MessageService) {
        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.arePeriodsOnMoreThanOneDay = true;
        $rootScope.pending++;
        Period.query().$promise.then(function(result) {
            $scope.periods = result;
            processPeriods($scope.periods);
            $scope.$watch('periods', function(newValue, oldValue) {
                processPeriods($scope.periods);
                checkPeriods($scope.periods);
            }, true);
            $rootScope.pending--;
        }, function(error) {
            $rootScope.messages.push(MessageService.errorMessage("Error loading periods.", 2000));
            $rootScope.pending--;
        });


        function processPeriods(periodArray) {
            $scope.arePeriodsOnMoreThanOneDay = (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) >= 1);
            if (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) === 0) {
                var newPeriod = getNewPeriod(periodArray);
                $scope.newPeriod = newPeriod;
            }
        }

        function getNewPeriod(periodArray) {
            var maxEndDate = dateUtil.getPeriodMaxEndDate(periodArray);
            if (maxEndDate === null) {
                maxEndDate = new Date();
                maxEndDate.setHours(0);
                maxEndDate.setMinutes(0);
                maxEndDate.setSeconds(0);
                maxEndDate.setMilliseconds(0);
            }
            var endDate = new Date(maxEndDate.getTime());
            endDate.setDate(maxEndDate.getDate() + 1);
            endDate.setHours(0);
            endDate.setMinutes(0);
            endDate.setSeconds(0);
            endDate.setMilliseconds(0);
            var newPeriod = {
                name: '',
                begin: maxEndDate,
                end: endDate
            };
            return newPeriod;
        }

        function checkPeriods(existingPeriods, newPeriod) {
            var periodValid = true;
            var periodArray = $scope.periods.slice();
            if (newPeriod && newPeriod.begin && newPeriod.end) {
                periodArray.push(newPeriod);
                $scope.errorMessage = "";
                if (newPeriod.end.getHours() !== 0 && newPeriod.end.getMinutes() !== 0) {
                    if (newPeriod.begin > newPeriod.end) {
                        $rootScope.messages.push(MessageService.errorMessage("Period begining must be inferior to period end.", 2000));
                        periodValid = false;
                    }
                }
            }
            /*
             if (dateUtil.arePeriodsOnMoreThanOneDay(periodArray) > 1) {
             $rootScope.messages.push(MessageService.errorMessage("Durations too long. Must be 24 hours at max.", 2000));
             periodValid = false;
             }
             */
            if (dateUtil.arePeriodsIntersecting(periodArray)) {
                $rootScope.messages.push(MessageService.errorMessage("The period is intersecting with another.", 2000));
                periodValid = false;
            }
            return periodValid;
        }


        $scope.savePeriod = function(period) {
            if (period && period.begin && period.end) {
                //check periods => length, intersection
                if (checkPeriods($scope.periods, period)) {
                    $rootScope.pending++;
                    Period.save({
                        name: period.name,
                        begin: period.begin,
                        end: period.end
                    }, function(result) {
                        angular.extend(period, result);
                        $scope.periods.push(period);
                        processPeriods($scope.periods);
                        //initNewPeriod();
                        $rootScope.messages.push(MessageService.successMessage("Period created.", 2000));
                        $rootScope.pending--;
                    }, function(error) {
                        $rootScope.messages.push(MessageService.errorMessage("Error creating period.", 2000));
                        $rootScope.pending--;
                    });
                }
            }
        };

        $scope.deletePeriod = function(period) {
            var $modalScope = $rootScope.$new(true);
            $modalScope.message = "the " + period.name + " period";
            var modalInstance = $modal.open({
                templateUrl: "views/modal/confirm.html",
                controller: "confirmModalController",
                scope: $modalScope,
                resolve: {
                    confirmed: function() {
                        return $scope.confirmed;
                    }
                }
            });
            modalInstance.result.then(function(confirmed) {
                if (confirmed) {
                    if (period.objectId) {
                        $rootScope.pending++;
                        Period.delete({"periodId": period.objectId}, function(result) {
                            $scope.periods.splice($scope.periods.indexOf(period), 1);
                            processPeriods($scope.periods);
                            $rootScope.pending--;
                        }, function(error) {
                            $rootScope.messages.push(MessageService.errorMessage("Problem deleting period", 2000));
                            $rootScope.pending--;
                        });
                    }
                }
            }, function() {
                //exit
            });

        };


        $scope.editPeriod = function(period) {
            period.isEdit = true;
            period.original = angular.extend({}, period);
        };

        $scope.cancelEditPeriod = function(period) {
            period.isEdit = false;
            period.begin = period.original.begin;
            period.end = period.original.end;
            period.name = period.original.name;
            delete period.original;
        };

        $scope.updatePeriod = function(period) {
            if (!checkPeriods($scope.periods)) {
                $scope.cancelEditPeriod(period);
            } else {
                if (period.objectId) {
                    $rootScope.pending++;
                    Period.update({"periodId": period.objectId}, {
                        name: period.name,
                        begin: period.begin,
                        end: period.end
                    }, function(result) {
                        period.isEdit = false;
                        processPeriods($scope.periods);
                        $rootScope.pending--;
                    }, function(error) {
                        $scope.cancelEditPeriod(period);
                        $rootScope.pending--;
                    });
                }
            }
        };

        $scope.$on('$routeChangeStart', function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            $rootScope.pending = 0;
            //clear messages
            $rootScope.messages = [];
        });


    }]);

ControllersModule.controller('userPreferencesController', ['$rootScope', '$scope', 'MessageService', 'UserService', 'User', 'Unit', 'dateUtil', function Controller($rootScope, $scope, MessageService, UserService, User, Unit, dateUtil) {
        $rootScope.messages = [];
        $rootScope.pending = 0;

        $scope.user = UserService.currentUser();
        if ($scope.user && !$scope.user.preferences) {
            $scope.user.preferences = {};
            $scope.user.preferences.firstDayOfWeek = 0;
        }
        if ($scope.user && $scope.user.preferences && !$scope.user.preferences.firstDayOfWeek) {
            $scope.user.preferences.firstDayOfWeek = 0;
        }
        $scope.days = dateUtil.getCurrentWeekSundayAndMonday();

        $scope.update = function(user) {
            $rootScope.pending++;
            User.update({
                'userId': $scope.user.objectId
            }, user,
                    function(result) {
                        UserService.updateUser(user);
                        $rootScope.pending--;
                    },
                    function(error) {
                        debugger;
                        $rootScope.pending--;
                    });
        };


        $rootScope.pending++;
        Unit.query().$promise.then(function(result) {
            $scope.units = result;
            if (result && result.length > 0) {
                if (!$scope.user.preferences.defaultUnit) {
                    $scope.user.preferences.defaultUnit = result[0];
                } else {
                    result.forEach(function(unit) {
                        if (unit.objectId === $scope.user.preferences.defaultUnit.objectId) {
                            $scope.user.preferences.defaultUnit = unit;
                        }
                    });
                }
                $rootScope.pending--;
            }
        },
                function(error) {
                    $rootScope.pending--;
                }
        );

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            $rootScope.pending = 0;
            //clear messages
            $rootScope.messages = [];
        });



    }]);




ControllersModule.controller('overviewController', ['$scope', '$rootScope', '$location', '$routeParams', '$filter', 'ResourceCode', 'dateUtil', 'UserService', 'overViewService', 'MessageService', 'printService', function Controller($scope, $rootScope, $location, $routeParams, $filter, ResourceCode, dateUtil, UserService, overViewService, MessageService, printService) {

        $rootScope.messages = [];
        $rootScope.pending = 0;
        $scope.data = [];

        var beginDate = null;
        var endDate = null;
        var currentDate = null;
        $scope.interval = 'week';

        if ($routeParams && $routeParams.weekDate) {
            currentDate = new Date($routeParams.weekDate);
        } else {
            currentDate = new Date();
        }
        if ($routeParams && $routeParams.interval) {
            $scope.interval = $routeParams.interval;
        }        
        $scope.timeInterval = overViewService.getTimeInterval($scope.interval, currentDate);
        
        var params = {where: {code:[1]}};
        

        $rootScope.pending++;
        overViewService.getTableData($scope.timeInterval, params).then(
                function resolve(result) {
                    $rootScope.pending--;
                    $scope.header = result[0];
                    $scope.data = result;
                },
                function reject(error) {
                    $rootScope.pending--;
                    $scope.header = [];
                    $scope.data = [];
                });

        $scope.printToPDF = function() {
            printService.convertTableToPDF($scope.data, renderCell.bind({
                interval: $scope.interval
            }));
        };

        function renderCell(rowIndex, columnIndex, cellData, tableData) {
            var valueToDisplay = "";
            if (cellData) {
                if (rowIndex === 0) {
                    if (cellData.name) {
                        valueToDisplay = cellData.name;
                    }
                } else {
                    if (columnIndex === 0) {
                        if (this.interval === 'week') {
                            valueToDisplay = $filter('date')(cellData.date, 'EEEE d MMM');
                        } else {
                            if(cellData.text){
                                valueToDisplay = cellData.text;
                            }                            
                        }
                    } else {
                        if (this.interval === 'week') {
                            if (cellData && Array.isArray(cellData)) {
                                cellData.forEach(function(element) {
                                    valueToDisplay += $filter('date')(element.dateTime, 'HH:mm') + " " + element.reading + " ";
                                });
                            }
                        } else {
                            if (cellData && Array.isArray(cellData)) {
                                cellData.forEach(function(element) {
                                    valueToDisplay = "Maximum: " + element.maximum + " / Minimum: " + element.minimum + " / Average: " + element.average + " / Number: " + element.nb;
                                });
                            }
                        }
                    }
                }
            }
            return valueToDisplay;
        }


        
        /**
         * Change grouping
         */
        $scope.change = function() {
            changeInterval(currentDate, $scope.interval, 0);
        };


        //view reading by id
        $scope.viewEvent = function(code, objectId) {            
            $location.path('event/'+ResourceCode[code]+"/"+objectId);
        };

        //create new reading with prefilled date and time
        $scope.addEvent = function(day, period) {
            //TODO display modal window to choose the type of event
            
            
            
            $location
                    .path('event')                    
                    .search('day', day.date.toISOString())
                    .search('time', period.begin.toISOString());
        };

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
            $location.path('overview').search('weekDate', newDate.toISOString()).search('interval', interval);
        }

        $scope.zoomInInterval = function(date) {
            var newInterval = '';
            switch ($scope.interval) {
                case 'month':
                    newInterval = 'week';
                    break;
                case 'year':
                    newInterval = 'month';
                    break;
                default:
                    newInterval = $$scope.interval;
                    break;
            }
            $location.path('overview').search('weekDate', date.toISOString()).search('interval', newInterval);
        };


        $scope.advance = function() {
            changeInterval(currentDate, $scope.interval, +1);
        };

        $scope.back = function() {
            changeInterval(currentDate, $scope.interval, -1);
        };

        $scope.currentWeek = function() {
            currentDate = new Date();
            changeInterval(currentDate, $scope.interval, 0);
        };

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($rootScope.messages);
            //clear messages
            $rootScope.messages = [];
        });
    }]);


ControllersModule.controller("importController", ["$scope", "importService", function Controller($scope, importService) {
        $scope.onFileSelect = function($files) {
            if (Array.isArray($files) && $files.length > 0) {
                importService.uploadFile($files[0]).then(function resolve(result) {
                    if (result && result.data && result.data.url) {
                        importService.downloadFile(result.data.url).then(function resolve(result) {
                            importService.processFile(result.data);
                        }, function reject() {
                            debugger;
                        });
                    }
                }, function reject(error) {
                    debugger;
                }, function progress(evt) {
                    console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
                });
            }
        };
    }]);


ControllersModule.controller('bloodGlucoseTargetController', ['$scope', 'BloodGlucoseTarget', 'Unit', 'UserService', function Controller($scope, BloodGlucoseTarget, Unit, UserService) {
        $scope.target = {};
        Unit.query().$promise.then(function(results) {
            $scope.units = results;
            //=====handle units
            if ($scope.target.unit) {
                $scope.units.forEach(function(unit) {
                    if (unit.objectId === $scope.target.unit.objectId) {
                        $scope.currentUnit = unit;
                    }
                });
            } else {
                if (UserService.currentUser().preferences && UserService.currentUser().preferences.defaultUnit) {
                    $scope.units.forEach(function(unit) {
                        if (unit.objectId === UserService.currentUser().preferences.defaultUnit.objectId) {
                            $scope.currentUnit = unit;
                        }
                    });
                } else {
                    $scope.currentUnit = $scope.units[0];
                }
            }
            $scope.$watch("currentUnit", function(newValue, oldValue) {
                if (newValue && oldValue) {
                    if ($scope.target && $scope.target.upperLevel || $scope.target && $scope.target.lowerLevel) {
                        if ($scope.target.upperLevel) {
                            $scope.target.upperLevel = $scope.target.upperLevel * oldValue.coefficient / newValue.coefficient;
                        }
                        if ($scope.target.lowerLevel) {
                            $scope.target.lowerLevel = $scope.target.lowerLevel * oldValue.coefficient / newValue.coefficient;
                        }

                    } else {
                        $scope.placeHolder = $scope.placeHolder * oldValue.coefficient / newValue.coefficient;
                    }
                }
            });
        });

        $scope.update = function(target) {
            target.unit = {__type: "Pointer", className: "Unit", objectId: $scope.currentUnit.objectId};
            BloodGlucoseTarget.save({}, target);
        };



    }]);