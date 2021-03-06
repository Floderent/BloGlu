(function () {
    angular.module('bloglu', [
        //angular
        'ngCookies',
        'ngResource',
        'ngTouch',
        //third party
        'ui.bootstrap',
        'ui.router',
        'highcharts-ng',        
        'pascalprecht.translate',
        'tmh.dynamicLocale',
        'LocalStorageModule',
        //application
        'bloglu.translation',
        'bloglu.engine',
        'bloglu.menuHeader',
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
        'bloglu.equals',
        'bloglu.eventDirective',
        'bloglu.eventGroupDirective',
        'bloglu.print',
        'bloglu.search',
        'bloglu.utils']);
})();