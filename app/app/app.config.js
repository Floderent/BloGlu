(function () {
    angular.module('bloglu')
            .config(['$urlRouterProvider',
                function ($urlRouterProvider) {
                    $urlRouterProvider.otherwise('/dashboard');
                }])
            .config(['$translateProvider', function ($translateProvider) {
                    $translateProvider.useStaticFilesLoader({
                        prefix: 'assets/i18n/locale-',
                        suffix: '.json'
                    });
                }])
            .config(['$httpProvider', function ($httpProvider) {
                    $httpProvider.interceptors.push('MyInterceptor');
                }]);
            
})();


