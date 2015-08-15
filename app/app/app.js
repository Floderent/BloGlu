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
            ]).run(run);

    run.$inject = ['$rootScope', '$state', 'UserSessionService', 'AUTH_EVENTS', 'menuHeaderService', 'syncService', 'MessageService'];

    function run($rootScope, $state, UserSessionService, AUTH_EVENTS, menuHeaderService, syncService, MessageService) {

        // Call when the the client is confirmed
        $rootScope.$on(AUTH_EVENTS.loginSuccess, function (event, params) {
            $rootScope.authenticated = true;
            $state.go('dashboard');

            menuHeaderService.increasePending('processingMessage.synchronizing');
            var syncMode = 'online';
            if (params) {
                syncMode = params.mode;
            }            
            syncService.sync(progressHandler, syncMode).then(
                    function () {
                        menuHeaderService.progress = 100;
                    },
                    function () {
                        MessageService.errorMessage('errorMessage.synchronisationError', 5000);
                    }
            )['finally'](function () {
                menuHeaderService.decreasePending('processingMessage.synchronizing');
            });
        });

        function progressHandler(progress, message) {
            menuHeaderService.loadingState.progress = progress;
            menuHeaderService.loadingState.syncMessage = message;
        }

        // Call when the 401 response is returned by the server
        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            $rootScope.authenticated = false;
            $state.go('login');
        });

        
        $rootScope.$on('$stateChangeStart', function (event, toState) {            
            if (toState.name !== 'login') {                
                if (!UserSessionService.getCurrentUser()) {
                    event.preventDefault();
                    $state.go('login');
                }
            }           
        });
        

        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            console.log(error);
        });




    }

})();
