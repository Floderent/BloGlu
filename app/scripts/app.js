'use strict';

angular.module('BloGlu.services', ['ngResource']);
angular.module('BloGlu.controllers', []);
angular.module('BloGlu.filters', []);
angular.module('BloGlu.directives', []);


var mainModule = angular
        .module('BloGlu', [            
            'ngResource',
            'ngSanitize',
            'ngRoute',
            'ui.bootstrap',
            'highcharts-ng',
            'angularFileUpload',
            'angularSpectrumColorpicker',
            'pascalprecht.translate',
            'tmh.dynamicLocale',
            'ngTouch',
            'LocalStorageModule',
            'BloGlu.services',
            'BloGlu.controllers',
            'BloGlu.filters',
            'BloGlu.directives'
        ]);

mainModule.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/login', {controller: 'loginController', templateUrl: 'views/login.html'});
        //events
        $routeProvider.when('/event/:eventType/:objectId', {controller: 'eventController', templateUrl: 'views/event.html'});
        $routeProvider.when('/event/:eventType', {controller: 'eventController', templateUrl: 'views/event.html'});
        //log book
        $routeProvider.when('/logBook', {controller: 'logBookController', templateUrl: 'views/logBook.html'});
        //reports        
        $routeProvider.when('/reports', {controller: 'reportListController', templateUrl: 'views/reportList.html'});
        $routeProvider.when('/reports/:objectId', {controller: 'reportController', templateUrl: 'views/report.html'});
        $routeProvider.when('/report/', {controller: 'reportController', templateUrl: 'views/report.html'});
        //Data
        ///Imports
        $routeProvider.when('/imports', {controller: 'importListController', templateUrl: 'views/importList.html'});
        $routeProvider.when('/imports/:objectId', {controller: 'importController', templateUrl: 'views/import.html'});        
        //Parameters
        $routeProvider.when('/ranges', {controller: 'rangeController', templateUrl: 'views/range.html'});
        $routeProvider.when('/periods', {controller: 'periodController', templateUrl: 'views/period.html'});
        $routeProvider.when('/eventTypes', {controller: 'categoryController', templateUrl: 'views/category.html'});
        
        $routeProvider.when('/userPreferences', {controller: 'userPreferencesController', templateUrl: 'views/userPreferences.html'});
        $routeProvider.when('/dashboard', {controller: 'dashboardController', templateUrl: 'views/dashboard.html'});
        //$routeProvider.when('/index', {controller: 'indexController', templateUrl: 'views/index.html'});
        $routeProvider.otherwise({redirectTo: '/dashboard'});
    }]);

mainModule.config(['$translateProvider', function($translateProvider) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'i18n/locale-',
            suffix: '.json'
        });
    }]);

mainModule.config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('MyInterceptor');
    }]);


mainModule.constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
});

mainModule.constant('ResourceCode', {
    other: 0,
    bloodGlucose: 1,
    medication: 2,
    weight: 3,
    bloodPressure: 4,
    a1c: 5,
    exercise: 6,
    foodIntake: 7,
    0: 'other',
    1: 'bloodGlucose',
    2: 'medication',
    3: 'weight',
    4: 'bloodPressure',
    5: 'a1c',
    6: 'exercise',
    7: 'foodIntake'
});

mainModule.constant('Database', {
    schema: [
        'User',
        'Report',
        'Period',        
        'Event',
        'Dashboard',
        'Metadatamodel',
        'Category',
        'Range',
        'Unit',
        'Import'
    ]
});

mainModule.constant('ResourceName', {
    0: 'otherEvent',
    1: 'bloodGlucoseEvent',
    2: 'medicationEvent',
    3: 'weightEvent',
    4: 'bloodPressureEvent',
    5: 'a1cEvent',
    6: 'exerciseEvent',
    7: 'foodIntakeEvent'
});

mainModule.constant('ResourceIcon',{
   0:'glyphicon glyphicon-tag' ,
   1:'glyphicon glyphicon-tint',
   2:'glyphicon glyphicon-briefcase',
   3:'glyphicon glyphicon-dashboard',
   4:'glyphicon glyphicon-heart',
   5:'glyphicon glyphicon-file',
   6:'glyphicon glyphicon-flash',
   7:'glyphicon glyphicon-cutlery'
});

mainModule.constant('DataVisualization', [
    {id: 'table', title:'tableDataviz'},    
    {id: 'pieChart', title:'pieChartDataviz'},
    {id: 'barChart', title:'barChartDataviz'},
    {id: 'lineChart', title:'lineChartDataviz'}
]);


mainModule.run(['$rootScope', 'localizationService', 'AUTH_EVENTS', 'UserSessionService', function($rootScope, localizationService, AUTH_EVENTS, UserSessionService) {        
        localizationService.setLanguage().then(function() {            
            $rootScope.$broadcast('language-change', localizationService.language);
            UserSessionService.isTokenValid().then(function(tokenValid) {
                if (!tokenValid) {
                    if(tokenValid === null){
                        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, {mode: "offline"});
                    }else{
                        $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                    }
                } else {                    
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, {mode: "online"});
                }
            });
        });
    }]);





