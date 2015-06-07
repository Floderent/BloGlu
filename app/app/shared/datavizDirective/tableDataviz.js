(function () {

    angular.module('bloglu.datavizDirective').directive('tableDataviz', tableDataviz);

    tableDataviz.$inject = ['$document', '$q', '$translate', 'dataService'];

    function tableDataviz($document, $q, $translate, dataService) {
        var linkFunction = function (scope, element, attrs) {         
            
            buildTable(element, scope);
            /*
             scope.$watch('config', function (newValue, oldValue) {
             buildTable(element, scope);
             }, true);            
             scope.$watch('columnOrder', function (newValue, oldValue) {
             buildTable(element, scope);
             }, true);
             */
        };

        function buildTable(element, scope) {
            if (scope.config) {
                var htmlElement = null;
                angular.element(element).append(buildLoadingDisplay());

                if (scope.config.data) {
                    $q.all([
                        scope.config.data,
                        scope.config.units
                    ]).then(function (results) {
                        var data = results[0];
                        var units = results[1];
                        var headers = scope.config.headers;
                        var columnOrder = scope.columnOrder;

                        element.empty();
                        if (headers && headers.length === 1 && data && data.length === 1) {
                            htmlElement = buildSingleValueTable(headers, data, units);
                            angular.element(element).append(buildTitle(scope.config.title));
                            angular.element(element).append(htmlElement);
                        } else {
                            //if no data returned
                            if (headers && headers.length === 1 && data && data.length === 0) {
                                htmlElement = buildNoValueDisplay();
                                angular.element(element).append(buildTitle(scope.config.title));
                                angular.element(element).append(htmlElement);
                            } else {
                                htmlElement = buildMultipleValueTable(element, headers, data, scope, columnOrder);
                                angular.element(element).append(buildTitle(scope.config.title));
                                angular.element(element).append(htmlElement);
                                angular.element(element).append(buildUnitDescription(units));
                            }
                        }
                    });
                }
            }
        }
        function buildTitle(title) {
            var titleElement = $document[ 0 ].createElement('h3');
            if (title) {
                titleElement.appendChild($document[ 0 ].createTextNode(title));
            }
            return titleElement;
        }

        function buildUnitDescription(reportUnits) {
            var unitDescriptionElement = $document[ 0 ].createElement('div');
            angular.forEach(reportUnits, function (reportUnit) {
                var unitSection = $document[ 0 ].createElement('span');
                unitSection.className = 'label label-primary';
                unitSection.appendChild($document[ 0 ].createTextNode($translate.instant(reportUnit.title) + ': ' + reportUnit.unit.description));
                unitDescriptionElement.appendChild(unitSection);
            });
            return unitDescriptionElement;
        }

        function buildSingleValueTable(headers, data, reportUnits) {
            var div = $document[ 0 ].createElement('div');
            var title = $document[ 0 ].createElement('h1');
            var value = $document[ 0 ].createElement('span');
            var reportUnit = '';
            if (reportUnits && reportUnits.length > 0 && reportUnits[0].unit && reportUnits[0].unit.description) {
                reportUnit = reportUnits[0].unit.description;
            }
            value.appendChild($document[ 0 ].createTextNode(data[0][headers[0].name] + ' ' + reportUnit));
            title.appendChild(value);
            div.appendChild(title);
            return div;
        }

        function buildNoValueDisplay() {
            var div = $document[ 0 ].createElement('div');
            var title = $document[ 0 ].createElement('h4');
            var value = $document[ 0 ].createElement('span');
            value.appendChild($document[ 0 ].createTextNode($translate.instant('noData')));
            title.appendChild(value);
            div.appendChild(title);
            return div;
        }

        function buildLoadingDisplay() {
            var div = $document[ 0 ].createElement('div');
            var image = $document[ 0 ].createElement('img');
            image.alt = 'loading';
            image.src = 'images/spinner.gif';
            div.appendChild(image);
            return div;
        }



        function buildMultipleValueTable(element, headers, data, scope, columnOrder) {
            var container = $document[ 0 ].createElement('div');
            container.className = 'table-responsive dataviz';
            var table = $document[ 0 ].createElement('table');
            table.className = 'table table-striped';
            var tableBody = $document[ 0 ].createElement('tbody');
            angular.forEach(headers, function (header) {
                var th = $document[ 0 ].createElement('th');
                th.addEventListener('click', headerClicked.bind({element: element, columnOrder: columnOrder, header: header, scope: scope, data: data, buildTable: buildTable}));
                var headerLink = $document[ 0 ].createElement('a');
                headerLink.appendChild($document[ 0 ].createTextNode($translate.instant(header.title)));
                var directionSpan = $document[ 0 ].createElement('span');

                directionSpan.className = getHeaderDirection(header.name);

                directionSpan.id = 'th-' + header.name;

                th.appendChild(headerLink);
                th.appendChild(directionSpan);
                tableBody.appendChild(th);
            });

            function getHeaderDirection(headerName) {
                var headerDirection = '';
                if (columnOrder && Array.isArray(columnOrder)) {
                    angular.forEach(columnOrder, function (order) {
                        if (order.alias === headerName) {
                            if (order.direction) {
                                if (order.direction.toUpperCase() === 'ASC') {
                                    headerDirection = 'glyphicon glyphicon-chevron-up';
                                } else {
                                    if (order.direction.toUpperCase() === 'DESC') {
                                        headerDirection = 'glyphicon glyphicon-chevron-down';
                                    }
                                }
                            }
                        }
                    });
                }
                return headerDirection;
            }
            dataService.orderBy(data, columnOrder);

            angular.forEach(data, function (row) {
                var tr = $document[ 0 ].createElement('tr');
                angular.forEach(headers, function (header) {
                    var td = $document[ 0 ].createElement('td');
                    td.appendChild($document[ 0 ].createTextNode(row[header.name]));
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });
            table.appendChild(tableBody);
            container.appendChild(table);

            return container;
        }


        function headerClicked(eventInfo) {
            var containsClause = false;
            if (!this.scope.columnOrder) {
                this.scope.columnOrder = [];
            } else {
                var that = this;
                angular.forEach(this.scope.columnOrder, function (orderClause, index) {
                    if (orderClause.alias === that.header.name) {
                        containsClause = true;
                        if (orderClause.direction === 'ASC') {
                            orderClause.direction = 'DESC';
                        } else {
                            if (orderClause.direction === 'DESC') {
                                that.columnOrder.splice(index, 1);
                            } else {
                                orderClause.direction = 'ASC';
                            }
                        }
                    }
                });
            }

            if (!containsClause) {
                var sortClause = {
                    alias: this.header.name,
                    direction: 'ASC'
                };
                if (this.header.sort) {
                    sortClause.sort = dataService.sort[this.header.sort];
                    sortClause.sort = this.header.sort;
                }
                this.scope.columnOrder.push(sortClause);
            }
            this.buildTable(this.element, this.scope);
        }
        return {
            restrict: 'E', // only activate on element
            replace: true,
            scope: {
                config: '=',
                columnOrder: '='
            },
            link: linkFunction
        };
    }
})();
