(function () {
    var addedDefaultStyles = false;
    TW.Runtime.Widgets.Burndown = function () {
        var columns, grid, gridBodyElement;
        this.renderHtml = function () {

            var widgetTemplate =
                '<div class="widget-content widget-burndownwidget burndownchart" style="visibility:hidden">' +
                '<svg id="d3chart"></svg>';
            widgetTemplate += '</div>';

            return widgetTemplate;
        };
        this.afterRender = function () {
            grid = this.jqElement;
            grid.css("visibility", this.getProperty("Visible") ? "visible" : "hidden");

            this.makeChart([{ date: new Date(2016,10,1), value: 0},
                            { date: new Date(2016,10,2), value: 1},
                    { date: new Date(2016,10,3), value: 1},
                    { date: new Date(2016,10,4), value: 1},
                    { date: new Date(2016,10,5), value: 4},
                    { date: new Date(2016,10,6), value: 4},
                    { date: new Date(2016,10,7), value: 6},
                    { date: new Date(2016,10,8), value: 6},
                    { date: new Date(2016,10,9), value: 6},
                    { date: new Date(2016,10,10), value: 6},
                    { date: new Date(2016,10,11), value: 7},
                    { date: new Date(2016,10,12), value: 7},
                    { date: new Date(2016,10,13), value: 9},
                            { date: new Date(2016,10,14), value: 9}],

                           [{ date: new Date(2016,10,1), value: 7},
                               { date: new Date(2016,10,2), value: 7},
                               { date: new Date(2016,10,3), value: 7},
                               { date: new Date(2016,10,4), value: 7},
                               { date: new Date(2016,10,5), value: 7},
                               { date: new Date(2016,10,6), value: 7},
                               { date: new Date(2016,10,7), value: 7},
                               { date: new Date(2016,10,8), value: 7},
                               { date: new Date(2016,10,9), value: 7},
                               { date: new Date(2016,10,10), value: 7},
                               { date: new Date(2016,10,11), value: 7},
                               { date: new Date(2016,10,12), value: 9},
                               { date: new Date(2016,10,13), value: 9},
                               { date: new Date(2016,10,14), value: 9}],
                new Date(2016,10,1),new Date(2016,10,14),9
            )
        };

        this.runtimeProperties = function () {
            return {
                'name': 'BlockedTasks',
                'description': 'Blocked tasks widget',
                'category': ['Common'],
                'needsDataLoadingAndError': true,
                'ShowDataLoading': true,
                'isResizable': true,
                'supportsAutoResize': true,
                'iconImage': 'BlockedTasks.ide.png',
                'properties': {}
            }
        };
        // this is called on your widget anytime bound data changes
        this.updateProperty = function (updatePropertyInfo) {

            TW.log.info("in updateProperty " + updatePropertyInfo.TargetProperty);

            if (updatePropertyInfo.TargetProperty === "Data") {
                var currentDataInfo = updatePropertyInfo,
                currentRows = currentDataInfo.ActualDataRows,
                infoTableDataShape = currentDataInfo.DataShape,
                    open = [],
                    scope = [],
                    maxscope = 0;

                for (var row in currentRows) {

                    open.push({date: currentRows[row].date, value: currentRows[row].open});
                    scope.push({date: currentRows[row].date, value: currentRows[row].scope});
                    if (currentRows[row].scope > maxscope) {
                        maxscope = currentRows[row].scope;
                    }
                };
                this.makeChart(open,scope,currentRows[0].date, currentRows[currentRows.length-1].date,maxscope);

            } else if (updatePropertyInfo.TargetProperty === "Visible") {
                grid.css("visibility", this.getProperty("Visible") ? "visible" : "hidden");
            }
        };
        // this is called on your widget anytime a service is invoked
        this.serviceInvoked = function (serviceName) {
            TW.log.info("in serviceInvoked(" + serviceName + ")");
        };

        this.makeChart = function ( open, scope, startDate, endDate, maxTasks) {

            var vis = d3.select('#d3chart'),
                openArea = [],
                scopeArea = [],
                chartElement = document.getElementById('d3chart-container'),
                chartWidth =  this.jqElement[0].clientWidth,
                chartHeight = this.jqElement[0].clientHeight,
                today = this.toMidnight( new Date()),
                xRange, yRange,
                tooltipTargetSize = Math.floor(Math.min(20, chartWidth / 20, chartHeight / 20)),
                tickSize = Math.floor(Math.min(5, chartWidth / 80, chartHeight / 80)),
                MARGIN = 40,
                xAxis, yAxis, yAxisTickSpacing, yAxisTopLimit, xAxisTickNumber;

            this.startDate = startDate;
            this.endDate = endDate;
            vis.attr('width', chartWidth);
            vis.attr('height', chartHeight);

            yAxisTickSpacing = Math.max(1, Math.floor((maxTasks  - 4) / 10) + 1);
            yAxisTopLimit = Math.max(1, yAxisTickSpacing * (Math.floor((maxTasks - 1) / yAxisTickSpacing) + 1));
            xAxisTickNumber = Math.max(1, (1 + endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

            xRange = d3.scaleTime().range([MARGIN,
                chartWidth - MARGIN]).domain([startDate,endDate]);
            yRange = d3.scaleLinear().range([chartHeight - 2*MARGIN,
                MARGIN]).domain([0, yAxisTopLimit]);

            xAxis = d3.axisBottom()
                .scale(xRange)
                .tickSize(tickSize)
                .tickFormat(this.makeDateLabel.bind(this))
                .ticks(xAxisTickNumber);

            yAxis = d3.axisLeft()
                .scale(yRange)
                .tickSize(tickSize)
                .ticks(yAxisTopLimit / yAxisTickSpacing);

            this.tooltipTargetSize = tooltipTargetSize;

            for (var i = 0; i < Math.max(open.length, scope.length); i++ ) {
                if (typeof open[i] !== 'undefined') {
                    openArea.push({date: open[i].date, v0: 0, v1: open[i].value});
                }
                if (typeof scope[i] !== 'undefined') {
                    if (typeof open[i] !== 'undefined' ) {
                        scopeArea.push({date: scope[i].date, v0: open[i].value, v1: scope[i].value});
                    }
                    if (typeof open[i] === 'undefined' || typeof open[i + 1] === 'undefined') {
                        scopeArea.push({date: scope[i].date, v0: 0, v1: scope[i].value});
                    }
                }
            }

// clear previous chart elements
            vis.selectAll('g, path, line').remove();

// functions to create lines and areas
            var lineFunc  = d3.line()
                    .x(function(d) { return xRange(d.date);})
        .y(function(d) { return yRange(d.value);}),
                areaFunc = d3.area()
                        .x( function(d) {
                            return xRange(d.date);})
                        .y0( function(d) {
                            return yRange(d.v0);})
                        .y1( function(d) {
                            return yRange(d.v1);});

            vis.append('svg:path')
                .attr('class', 'chart-opentasks-color chart-line')
                .attr('d', lineFunc(open))
                .attr('data-legend','Open tasks');

            vis.append('svg:path')
                .attr('class', 'chart-opentasks-area chart-area')
                .attr('d', areaFunc(openArea));

            vis.append('svg:path')
                .attr('class', 'chart-scope-color chart-line')
                .attr('d', lineFunc(scope))
                .attr('data-legend', 'Scope');

            vis.append('svg:path')
                .attr('class', 'chart-scope-area chart-area')
                .attr('d', areaFunc(scopeArea));

            vis.append('svg:path')
                .attr('class', 'chart-ideal chart-line')
                .attr('d', lineFunc([{date: startDate, value: maxTasks}, {date: endDate, value: 0}]))
                .attr('data-legend', 'Ideal');

            this.addTooltipHitBoxes(vis, open, xRange, yRange, 'chart-opentasks-hitbox');
            this.addTooltipHitBoxes(vis, scope, xRange, yRange, 'chart-scope-hitbox');

            if (today.getTime() >= startDate.getTime() && today.getTime() <= endDate.getTime() ) {
                vis.append('svg:line')
                    .attr('class', 'chart-line chart-today-line')
                    .attr('x1', xRange(today))
                    .attr('x2', xRange(today))
                    .attr('y1', yRange(yAxisTopLimit))
                    .attr('y2', yRange(0));

                vis.append('svg:g')
                    .attr('transform','translate(' + xRange(today) + ',' + yRange(yAxisTopLimit) + ')')
                    .append('text')
                    .attr('class','chart-today-label')
                    .attr('transform', 'rotate(-90)')
                    .attr('dy', '1.5em')
                    .attr('dx', '-1.5em')
                    .text('Today');
            }

            // tooltip element
            vis.append('svg:g')
                .style('opacity', 0)
                .attr('id','chart-tooltip')
                .style('overflow', 'visible')
                .append('text')
                .style('z-index', '10')
                .attr('y',-4)
                .attr('class','chart-tooltip');


            vis.append('svg:g')
                .attr('class', 'x-axis axis')
                .attr('transform', 'translate(0,' + (chartHeight - 2*MARGIN) + ')')
                .call(xAxis);

            vis.append('svg:g')
                .attr('class', 'y-axis axis')
                .attr('transform', 'translate(' + (MARGIN) + ',0)')
                .call(yAxis);


            vis.selectAll('.axis line, .axis path')
                .attr('class', 'tickmark');

// Create gridlines
            vis.selectAll('.y-axis')
                .selectAll('.tick')
                .append('svg:line')
                .attr('class', 'gridline')
                .attr('x2', chartWidth - MARGIN - MARGIN)
                .attr('y2', 0);
        };

        /**
         * Creates hitbox rectangles that make visible the tooltip and sets its contents
         * @param chart a selection containing the chart elements
         * @param data the data points to write the tooltip hitboxes on
         * @param xRange the x range of the chart
         * @param yRange the y range of the chart
         * @param classid a classname that will be assigned to the hitboxes. Should be unique, having
         *         no other elements in the page with that class
         * @param addclass classname to be added to the tooltip when activated from here
         */
        this.addTooltipHitBoxes = function ( chart, data, xRange, yRange, classid) {
            chart.selectAll('.' + classid).data(data)
                .enter().append('g')
                .attr('transform',function(d) { return 'translate(' + xRange(d.date) + ',' + yRange(d.value) + ')';})
                .append('rect')
                .attr('width', this.tooltipTargetSize)
                .attr('height', this.tooltipTargetSize)
                .attr('x', -this.tooltipTargetSize / 2)
                .attr('y', -this.tooltipTargetSize / 2)
                .attr('class','chart-tooltip-hitbox ' + classid)
                .style('pointer-events', 'all')
                .attr('visibility', 'hidden')
                .on('mouseover', function(e){
                    var valstring = e.value.toString();
                    chart.select('#chart-tooltip')
                        .attr('transform','translate(' + (xRange(e.date) -
                            (valstring.length * 5)) + ',' + yRange(e.value) + ')')
                        .style('opacity', 1)
                        .select('text')
                        .text(valstring);
                })
                .on('mouseout', function(){
                    chart.select('#chart-tooltip').style('opacity', 0);
                });

        }

        this.positionYLabel = function() {
            var yContainer = document.getElementsByClassName('chart-y-label-container'),
                yLabel = document.getElementsByClassName('chart-y-label');
            jQuery(yLabel).css({left: yContainer[0].clientWidth / 2 - yLabel[0].clientHeight,
                top: (yContainer[0].clientHeight / 2) - (MARGIN - MARGIN) / 2});
        }

// The first labels and first days of months are monthname and date, the others are date only
        this.makeDateLabel = function (date) {
            var label;
            var startDateMidnight = this.toMidnight(new Date(this.startDate.getTime() -
                    (1000 * 3600 * 24))),
                endDateMidnight  = this.toMidnight(new Date(this.endDate.getTime() -
                    (1000 * 3600 * 24)));
            if ((endDateMidnight.getTime() - startDateMidnight.getTime()) < (1000 * 3600 * 24) * 29) {
                // sprint shorter than 4 weeks
                // first day of sprint and first day of each month get MMM D label, others get D
                if ((date.getDate() === startDateMidnight.getDate() && date.getMonth() === startDateMidnight.getMonth())
                    || (date.getDate() === 1)) {
                    label = this.makeLongLabel(date);
                } else {
                    label = date.getDate().toString();
                }
            } else {
                // sprint longer than 4 weeks
                if (Math.round(((date.getTime() - startDateMidnight.getTime()) / (1000 * 3600 * 24)) % 7) === 0) {
                    if ((date.getDate() === startDateMidnight.getDate() && date.getMonth() === startDateMidnight.getMonth())
                        || (date.getDate() < 8)) {
                        label = this.makeLongLabel(date);
                    } else {
                        label = date.getDate().toString();
                    }
                } else {
                    label = '';
                }

            }

            return label;
        }

        this.makeLongLabel = function (date) {
            var label;
            try {
                label = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            } catch (ex) {
                // for browsers that don't support toLocalDateString (Safari as of writing this)
                var longDate = date.toDateString();
                label = longDate.substr(longDate.indexOf(' ') + 1, longDate.length - 9);
            }
            return label;
        }

// Returns the local time representing midnight at the start of the day specified
        this.toMidnight = function(date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }

    };
}());
//# sourceMappingURL=BlockedTasks.runtime.js.map
