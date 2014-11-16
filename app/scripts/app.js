'use strict';

angular.module('BloGlu.services', ['ngResource']);
angular.module('BloGlu.controllers', []);
angular.module('BloGlu.filters', []);
angular.module('BloGlu.directives', []);


var mainModule = angular
        .module('BloGlu', [
            'ipCookie',           
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
            'BloGlu.services',
            'BloGlu.controllers',
            'BloGlu.filters',
            'BloGlu.directives'
        ]);

mainModule.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/login', {controller: 'loginController', templateUrl: 'views/login.html'});
        $routeProvider.when('/event/:eventType/:objectId', {controller: 'eventController', templateUrl: 'views/event.html'});
        $routeProvider.when('/event/:eventType', {controller: 'eventController', templateUrl: 'views/event.html'});
        $routeProvider.when('/logBook', {controller: 'logBookController', templateUrl: 'views/logBook.html'});
        $routeProvider.when('/period', {controller: 'periodController', templateUrl: 'views/period.html'});
        $routeProvider.when('/category', {controller: 'categoryController', templateUrl: 'views/category.html'});
        $routeProvider.when('/range', {controller: 'rangeController', templateUrl: 'views/range.html'});
        $routeProvider.when('/charts', {controller: 'chartController', templateUrl: 'views/charts.html'});
        $routeProvider.when('/report/:objectId', {controller: 'reportController', templateUrl: 'views/report.html'});
        $routeProvider.when('/report', {controller: 'reportController', templateUrl: 'views/report.html'});
        $routeProvider.when('/reportList', {controller: 'reportListController', templateUrl: 'views/reportList.html'});
        $routeProvider.when('/import', {controller: 'importController', templateUrl: 'views/import.html'});
        $routeProvider.when('/import/:objectId', {controller: 'importController', templateUrl: 'views/import.html'});
        $routeProvider.when('/importList', {controller: 'importListController', templateUrl: 'views/importList.html'});
        $routeProvider.when('/userPreferences', {controller: 'userPreferencesController', templateUrl: 'views/userPreferences.html'});
        $routeProvider.when('/dashboard', {controller: 'dashboardController', templateUrl: 'views/dashboard.html'});
        $routeProvider.when('/index', {controller: 'indexController', templateUrl: 'views/index.html'});
        $routeProvider.otherwise({redirectTo: '/'});
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
    0: 'other',
    1: 'bloodGlucose',
    2: 'medication',
    3: 'weight',
    4: 'bloodPressure',
    5: 'a1c',
    6: 'exercise'
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
    6: 'exerciseEvent'   
});

mainModule.constant('DataVisualization', {
    table: 'tableDataviz',
    chart: 'chartDataviz',
    pieChart: 'pieChartDataviz',
    barChart: 'barChartDataviz',
    lineChart: 'lineChartDataviz'
});


mainModule.run(['$rootScope', 'localizationService', 'AUTH_EVENTS', 'UserSessionService', function($rootScope, localizationService, AUTH_EVENTS, UserSessionService) {        
        localizationService.setLanguage().then(function() {            
            $rootScope.$broadcast('language-change', localizationService.language);
            UserSessionService.isTokenValid().then(function(tokenValid) {
                if (!tokenValid) {
                    $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
                } else {
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                }
            });
        });
    }]);





