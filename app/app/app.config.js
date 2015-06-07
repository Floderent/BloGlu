(function () {
    angular.module('bloglu')
            .config(['$routeProvider',
                function ($routeProvider) {
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
            });
})();


