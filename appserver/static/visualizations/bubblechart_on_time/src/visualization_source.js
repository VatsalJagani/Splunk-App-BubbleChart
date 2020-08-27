/*
 * Visualization source
 */
define([
        'jquery',
        'underscore',
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
        'chart.js/dist/Chart'
    ],
    function(
            $,
            _,
            SplunkVisualizationBase,
            vizUtils,
            chartjs
        ) {
    // Extend from SplunkVisualizationBase
    return SplunkVisualizationBase.extend({
  
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);
            this.$el = $(this.el);
            
            chartId = this.name + "-bubblechartontime";
            this.$el.html('<div id="' + chartId + '" class="'+this.className+'"></div><div style="width:100%;"><canvas id="canvas"></canvas></div>');
            
            // Initialization logic goes here
        },

        // Optionally implement to format data returned from search. 
        // The returned object will be passed to updateView as 'data'
        formatData: function(dataSet) {

            var y_axis_label = "No. of Devices";
            var normalize_radius_min = 5;
            var normalize_radius_max = 25;

            var data = dataSet['rows'];
            var headers = dataSet['fields'];
            var labels = [];
            var all_data = [];
            var all_data_min = [];
            var all_data_max = [];
            var no_of_col = 0;
            var all_data_radius = [];
            
            _.each(data, function(row, i){
                no_of_col = row.length;
            });

            for(i=1;i<no_of_col;i++){
                all_data.push([]);
                all_data_radius.push([]);
            }

            _.each(data, function(row, i){
                labels.push(row[0]); // X-Axis labels from 1st row of search result

                for(i=1;i<no_of_col;i++){
                    all_data[i-1].push(row[i]);
                }
            });

            for(i=1;i<no_of_col;i++){
                all_data_max.push(Math.max.apply(Math,all_data[i-1]));
            }

            for(i=1;i<no_of_col;i++){
                all_data_min.push(Math.min.apply(Math,all_data[i-1]));
            }

            _.each(data, function(row, i){
                for(i=1;i<no_of_col;i++){
                    normalized = (((row[i] - all_data_min[i-1])/(all_data_max[i-1] - all_data_min[i-1]))*(normalize_radius_max - normalize_radius_min)) + normalize_radius_min
                    all_data_radius[i-1].push(normalized);
                }
            });

            function getRandomColor() {
                var letters = '0123456789ABCDEF'.split('');
                var color = '#';
                for (var i = 0; i < 6; i++ ) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            }

            var data_main = [];
            for(i=1;i<no_of_col;i++){
                var color = getRandomColor();
                data_main.push({
                    label: headers[i],
                    data:all_data[i-1],
                    backgroundColor: color,
                    borderColor: color,
                    fill: false,
                    showLine: false,
                    pointRadius: all_data_radius[i-1],
                    pointHoverRadius: all_data_radius[i-1]
                })
            }


            var chartData = {
                labels:labels,
                all_data:data_main,
                x_axis_label:headers[0],
                y_axis_label:y_axis_label
            };
            return chartData;
        },
  
        // Implement updateView to render a visualization.
        //  'data' will be the data object returned from formatData or from the search
        //  'config' will be the configuration property object
        updateView: function(data, config) {
            // Draw something here
            var config = {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: data.all_data,
                },
                options: {
                    responsive: true,
                    legend: {
                        position: 'bottom',
                    },
                    hover: {
                        mode: 'index'
                    },
                    scales: {
                        xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: data.x_axis_label
                            }
                        }],
                        yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: data.y_axis_label
                            }
                        }]
                    }
                }
            };
            var ctx = document.getElementById('canvas').getContext('2d');
            window.myLine = new Chart(ctx, config);
        },

        // Search data params
        getInitialDataParams: function() {
            return ({
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            });
        },

        // Override to respond to re-sizing events
        // reflow: function() {}
    });
});