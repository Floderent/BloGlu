'use strict';
var ControllersModule = angular.module('BloGlu.controllers');



ControllersModule.controller('rangeUnitSelectController', ['$scope', function Controller($scope) {
        
        $scope.$watch('range.isEdit', function(newValue, oldValue){            
            if(newValue){
                angular.forEach($scope.units,function(unit){
                    if(unit.objectId === $scope.range.unit.objectId){
                        $scope.editedRangeUnit = unit;
                    }
                });
            }
        });        
        $scope.$watch('editedRangeUnit', function(newValue, oldValue) {             
            if (newValue && oldValue && newValue !== oldValue) {
                if ($scope.range && $scope.range.lowerLimit !== null) {
                    $scope.range.lowerLimit = $scope.range.lowerLimit * oldValue.coefficient / newValue.coefficient;
                } 
                if ($scope.range && $scope.range.upperLimit !== null) {
                    $scope.range.upperLimit = $scope.range.upperLimit * oldValue.coefficient / newValue.coefficient;
                }
                $scope.range.unit = newValue;
            }
        });
    }]);



ControllersModule.controller('confirmModalController', ['$scope', '$modalInstance', function Controller($scope, $modalInstance) {                
        $scope.ok = function() {            
            $modalInstance.close(1);
        };
        $scope.cancel = function() {
            $modalInstance.dismiss(0);
        };
    }]);


ControllersModule.controller('chooseEventController', ['$scope', '$modalInstance', function Controller($scope, $modalInstance) {        
        $scope.code = null;
        $scope.selectType = function(key){
            $scope.code = parseInt(key);            
        };
        $scope.ok = function() {            
            $modalInstance.close($scope.code);
        };
        $scope.cancel = function() {
            $modalInstance.dismiss(0);
        };
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
                    angular.forEach(result,function(unit) {
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