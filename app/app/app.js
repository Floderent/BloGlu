(function () {
    'use strict';

    angular.module('bloglu')
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
            .run(run);

    run.$inject = ['$rootScope', 'localizationService', 'AUTH_EVENTS', 'UserSessionService'];

    function run($rootScope, localizationService, AUTH_EVENTS, UserSessionService) {
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
    }

})();
