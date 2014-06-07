'use strict';

angular.module('BloGlu.services', ['ngResource']);
angular.module('BloGlu.controllers', []);
angular.module('BloGlu.directives', []);


var mainModule = angular
        .module('BloGlu', [
            'ngCookies',
            'ngResource',
            'ngSanitize',
            'ngRoute',
            'ui.bootstrap',
            'highcharts-ng',
            'angularFileUpload',
            'angularSpectrumColorpicker',
            'BloGlu.services',
            'BloGlu.controllers',
            'BloGlu.directives'
        ]);

mainModule.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/event/:eventType/:objectId', {controller: 'eventController', templateUrl: 'views/event.html'});
        $routeProvider.when('/event/:eventType', {controller: 'eventController', templateUrl: 'views/event.html'});
        $routeProvider.when('/overview', {controller: 'overviewController', templateUrl: 'views/overView.html'});
        $routeProvider.when('/period', {controller: 'periodController', templateUrl: 'views/period.html'});
        $routeProvider.when('/category', {controller: 'categoryController', templateUrl: 'views/category.html'});
        $routeProvider.when('/range', {controller: 'rangeController', templateUrl: 'views/range.html'});
        $routeProvider.when('/inputBgTarget', {controller: 'bloodGlucoseTargetController', templateUrl: 'views/inputBloodGlucoseTarget.html'});
        $routeProvider.when('/charts', {controller: 'chartController', templateUrl: 'views/charts.html'});
        $routeProvider.when('/report', {controller: 'reportController', templateUrl: 'views/report.html'});
        $routeProvider.when('/import', {controller: 'importController', templateUrl: 'views/import.html'});
        $routeProvider.when('/userPreferences', {controller: 'userPreferencesController', templateUrl: 'views/userPreferences.html'});
        $routeProvider.when('/dashboard', {controller: 'dashboardController', templateUrl: 'views/dashboard.html'});
        $routeProvider.when('/index', {controller: 'indexController', templateUrl: 'views/index.html'});
        $routeProvider.otherwise({redirectTo: '/'});
    }]);


mainModule.run(['$rootScope', '$modal', '$location', 'UserService', 'MessageService', 'syncService', 'dataService', 'queryService', function($scope, $modal, $location, UserService, MessageService, syncService, dataService, queryService) {

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
                        .success(function(authenticatedUser) {
                            $scope.pending--;
                            $scope.currentUser = authenticatedUser;
                            //sync
                            syncService.sync().finally(function(result) {
                            });                            
                            $location.path('dashboard');
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