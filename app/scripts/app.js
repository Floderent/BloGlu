'use strict';

var mainModule = angular
        .module('BloGlu', [
            'ngCookies',
            'ngResource',
            'ngSanitize',
            'ngRoute',
            'ui.bootstrap',
            'highcharts-ng',
            'angularFileUpload',
            'BloGlu.services',
            'BloGlu.modelServices',
            'BloGlu.controllers',
            'BloGlu.directives'
        ]);

mainModule.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/event/:eventType/:objectId', {controller: 'eventController', templateUrl: 'views/inputGly.html'});
        $routeProvider.when('/event/:eventType', {controller: 'eventController', templateUrl: 'views/inputGly.html'});
        $routeProvider.when('/overview', {controller: 'overviewController', templateUrl: 'views/overView.html'});
        $routeProvider.when('/inputPeriod', {controller: 'inputPeriodController', templateUrl: 'views/inputPeriod.html'});
        $routeProvider.when('/inputBgTarget', {controller: 'bloodGlucoseTargetController', templateUrl: 'views/inputBloodGlucoseTarget.html'});
        $routeProvider.when('/charts', {controller: 'chartController', templateUrl: 'views/charts.html'});
        $routeProvider.when('/import', {controller: 'importController', templateUrl: 'views/import.html'});
        $routeProvider.when('/userPreferences', {controller: 'userPreferencesController', templateUrl: 'views/userPreferences.html'});
        $routeProvider.when('/index', {controller: 'indexController', templateUrl: 'views/index.html'});
        $routeProvider.otherwise({redirectTo: '/'});
    }]);


mainModule.run(["$rootScope", "$modal", "UserService", "MessageService", function($scope, $modal, UserService, MessageService) {
        $scope.currentUser = UserService.currentUser();
        $scope.messages = [];
        $scope.pending = 0;
        var modal = null;

        $scope.displaySignUpModal = function() {
            $scope.messages = [];            
            modal = $modal.open({
                templateUrl: 'views/modal/inputUser.html',
                controller: 'inputUserController'
            });
        };

        $scope.displayResetPasswordModal = function() {
            $scope.messages = [];            
            modal = $modal.open({
                templateUrl: 'views/modal/resetPassword.html',
                controller: 'resetPasswordController'
            });
        };

        $scope.logIn = function(form) {
            if (form) {
                $scope.pending++;
                UserService.logIn(form.username, form.password)
                        .success(function(result) {
                            $scope.pending--;
                            $scope.currentUser = result;
                        })
                        .error(function(error) {
                            $scope.pending--;
                            switch (error.code) {
                                case 101:
                                    $scope.messages.push(MessageService.message("error", "Wrong login and/or password", 2000));
                                    break;

                                default:
                                    $scope.messages.push(MessageService.message("error", "Cannot login", 2000));
                                    break;

                            }
                        });
            }
        };
    
        $scope.logOut = function() {
            UserService.logOut();
            $scope.currentUser = null;
        };

        $scope.$on("$routeChangeStart", function() {
            //cancel promise
            MessageService.cancelAll($scope.messages);
            $scope.pending = 0;
            //clear messages
            $scope.messages = [];
        });
    }]);





mainModule.config(["$httpProvider", function($httpProvider) {
        $httpProvider.interceptors.push("MyInterceptor");
    }]);