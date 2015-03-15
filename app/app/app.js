'use strict';

//Modules declarations
//components
angular.module('bloglu.application',[]);
angular.module('bloglu.category',[]);
angular.module('bloglu.dashboard',[]);
angular.module('bloglu.event',[]);
angular.module('bloglu.import',[]);
angular.module('bloglu.logbook',[]);
angular.module('bloglu.login',[]);
angular.module('bloglu.period',[]);
angular.module('bloglu.range',[]);
angular.module('bloglu.report',[]);
angular.module('bloglu.userPreferences',[]);

//shared
angular.module('bloglu.chart',[]);
angular.module('bloglu.confirmModal',[]);
angular.module('bloglu.dashboardReport',[]);
angular.module('bloglu.datavizDirective',[]);
angular.module('bloglu.engine',[]);
angular.module('bloglu.equals',[]);
angular.module('bloglu.eventDirective',[]);
angular.module('bloglu.eventGroupDirective',[]);
angular.module('bloglu.print',[]);
angular.module('bloglu.utils',[]);


angular
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
            'facebook',
            
            'bloglu.application',
            'bloglu.category',
            'bloglu.dashboard',
            'bloglu.event',
            'bloglu.import',
            'bloglu.logbook',
            'bloglu.login',
            'bloglu.period',
            'bloglu.range',
            'bloglu.report',
            'bloglu.userPreferences',
            'bloglu.chart',
            'bloglu.confirmModal',
            'bloglu.dashboardReport',
            
            'bloglu.chart',
            'bloglu.confirmModal',
            'bloglu.dashboardReport',
            'bloglu.datavizDirective',
            'bloglu.engine',
            'bloglu.equals',
            'bloglu.eventDirective',
            'bloglu.eventGroupDirective',
            'bloglu.print',
            'bloglu.utils'])
.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/login', {controller: 'loginController', templateUrl: 'app/components/login/templates/login.html'});
        //events
        $routeProvider.when('/event/:eventType/:objectId', {controller: 'eventController', templateUrl: 'app/components/event/templates/event.html'});
        $routeProvider.when('/event/:eventType', {controller: 'eventController', templateUrl: 'app/components/event/templates/event.html'});
        //log book
        $routeProvider.when('/logBook', {controller: 'logBookController', templateUrl: 'app/components/logbook/templates/logBook.html'});
        //reports        
        $routeProvider.when('/reports', {controller: 'reportListController', templateUrl: 'app/components/report/templates/reportList.html'});
        $routeProvider.when('/reports/:objectId', {controller: 'reportController', templateUrl: 'app/components/report/templates/report.html'});
        $routeProvider.when('/report/', {controller: 'reportController', templateUrl: 'app/components/report/templates/report.html'});
        //Data
        ///Imports
        $routeProvider.when('/imports', {controller: 'importListController', templateUrl: 'app/components/import/templates/importList.html'});
        $routeProvider.when('/imports/:objectId', {controller: 'importController', templateUrl: 'app/components/import/templates/import.html'});
        //Parameters
        $routeProvider.when('/ranges', {controller: 'rangeController', templateUrl: 'app/components/range/templates/range.html'});
        $routeProvider.when('/periods', {controller: 'periodController', templateUrl: 'app/components/period/templates/period.html'});
        $routeProvider.when('/eventTypes', {controller: 'categoryController', templateUrl: 'app/components/category/templates/category.html'});

        $routeProvider.when('/userPreferences', {controller: 'userPreferencesController', templateUrl: 'app/components/userPreferences/templates/userPreferences.html'});
        $routeProvider.when('/dashboard', {controller: 'dashboardController', templateUrl: 'app/components/dashboard/templates/dashboard.html'});
        
        $routeProvider.otherwise({redirectTo: '/dashboard'});
    }])
.config(['$translateProvider', function ($translateProvider) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'assets/i18n/locale-',
            suffix: '.json'
        });
}])
.config(['$httpProvider', function ($httpProvider) {
        $httpProvider.interceptors.push('MyInterceptor');
}])
.config(function (FacebookProvider) {
    var appId = '423840851054944';
    FacebookProvider.init(appId);
})
.constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
})
.constant('ResourceCode', {
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
})
.constant('Database', {
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
})
.constant('ResourceName', {
    0: 'otherEvent',
    1: 'bloodGlucoseEvent',
    2: 'medicationEvent',
    3: 'weightEvent',
    4: 'bloodPressureEvent',
    5: 'a1cEvent',
    6: 'exerciseEvent',
    7: 'foodIntakeEvent'
})
.constant('ResourceIcon', {
    0: 'glyphicon glyphicon-tag',
    1: 'glyphicon glyphicon-tint',
    2: 'glyphicon glyphicon-briefcase',
    3: 'glyphicon glyphicon-dashboard',
    4: 'glyphicon glyphicon-heart',
    5: 'glyphicon glyphicon-file',
    6: 'glyphicon glyphicon-flash',
    7: 'glyphicon glyphicon-cutlery'
})
.constant('DataVisualization', [
    {id: 'table', title: 'tableDataviz'},
    {id: 'pieChart', title: 'pieChartDataviz'},
    {id: 'barChart', title: 'barChartDataviz'},
    {id: 'lineChart', title: 'lineChartDataviz'}
])
.run(['$rootScope', 'localizationService', 'AUTH_EVENTS', 'UserSessionService', function ($rootScope, localizationService, AUTH_EVENTS, UserSessionService) {
        localizationService.setLanguage().then(function () {
            $rootScope.$broadcast('language-change', localizationService.language);
            UserSessionService.isTokenValid().then(function (tokenValid) {
                if (!tokenValid) {
                    if (tokenValid === null) {
                        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, {mode: "offline"});
                    } else {
                        $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                    }
                } else {
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess, {mode: "online"});
                }
            });
        });
    }]);