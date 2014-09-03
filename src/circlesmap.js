// event circlesmap
var circlesmap_generator = function(){
  var margin = {top:20, right:20, bottom: 20, left: 60},
      height = 40,
      cell_height = 40,
      canvas_width,
      width;

  var initCanvasSize = function(){
      canvas_width = +(d3.select('#circlesmap').style('width').replace('px', ''));
      width = canvas_width - margin.left - margin.right;
  }

  var current_month_range = [new Date(2007, 1), new Date(2008, 1)]
  var gtd_data = {};
  var data;
  var svg;
  var xScale, rScale;
  var country_circles;
  var xAxis;
  var countries;

  var formatting_data = function(raw_data) {
    // if gtd data is already formatted, then return it
    if (!_.isEmpty(gtd_data)) { return gtd_data; }

    //console.log(raw_data)
    for(var i=0; i < raw_data.length; i++){
      var country = raw_data[i].country,
      year    = +raw_data[i].year,
      month   = +raw_data[i].month,
      day     = +raw_data[i].day,
      nkill   = +raw_data[i].nkill;

      if(_.isEmpty(gtd_data[country])) { gtd_data[country] = []; }

      date = new Date(year, month-1, day)

      gtd_data[country].push({
        time  : date,
        nkill : nkill,
        visible: false
      });
    }

    // sort all the events by time
    _.each(gtd_data, function(country_event_list){
      country_event_list = country_event_list.sort(function(a, b){
        return a.time - b.time;
      });
    });
    return gtd_data;
  };

  var dateDiff = function(from, to) {
    var milliseconds = to - from;
    return milliseconds / 86400000;
  };

  var update_month_range = function(time_range) {
    // get the time range
    if(typeof time_range !== 'undefined'){
      current_month_range = time_range;
    }

    redraw_axis();
    
    if(!data) {
      console.log("No data");
      return;
    }
    
    console.log("Update visibility");
    for(var i=0; i<data.length; i++){
      var d = data[i].days;
      for(var j=0; j<d.length; j++){
        var date = d[j].time;

        if(date > current_month_range[0] && date < current_month_range[1]) {
          d[j].visible = true; 
        } else {
          d[j].visible = false; 
        }
      }
    }

    update_circles_map();
  };

  var update_circles_map = function() {
    // update each counrty separately
    if(!data) {
      console.log("No data");
      return;
    }

    console.log("Update Radius");
    for(var i=0; i<data.length; i++){
      country_circles[i].selectAll("circle")
                        .attr("r", function(d) { 
        if(d.visible) {
          return rScale(d.nkill);
        } else {
          // hide the circle if it's not there
          return 0;
        }
      })
      .attr("cx", function(d, i) { return xScale(d.time) });
    }
  }

  var redraw_axis = function() {
    console.log('redraw axis');

    // remove old axis
    d3.selectAll("g.xAxis").remove();

    // update the time scale to current range
    xScale = d3.time.scale()
                    .range([0, width])
                    .domain(current_month_range);

    xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient('top');

    // Draw the xAxis text
    var days = dateDiff(current_month_range[0], current_month_range[1])

    if( days < 95)
      xAxis.ticks(d3.time.month, 1)
            .tickFormat(d3.time.format('%Y-%B'))
    else if (days < 500)
      xAxis.ticks(d3.time.month, 3)
            .tickFormat(d3.time.format('%Y-%B'))
    else 
      xAxis.ticks(d3.time.year, 1)
            .tickFormat(d3.time.format('%Y'))

    // Draw xAxis grid
    d3.select("#circlesmap svg")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("class", "x grid xAxis")
            .call(xAxis);
  }

  //TODO
  var update_countries_list = function(new_countries_list) {
    if(new_countries_list.length - countries.length === 1) {
      // add country
      height = countries.length * cell_height;

      d3.select("#circlesmap")
        .attr("height", height + margin.top + margin.bottom)
    }

    if(new_countries_list.length - countries.length === -1) {
      // remove country
    }
  }

  var update_view = function() {
    // countries added to list
    countries = WORLDMAP.countries; // ["3_Letters_Country_Code"]

    if(countries.length == 0){
      // Remove old circlesmap
      d3.select("div#circlesmap svg").remove();
      return ;
    }

    // calculate svg height
    height = countries.length * cell_height;

    // generating data to draw with
    data = _.map(countries, function(country) {
      return {
        country: country, 
        days: gtd_data[country]
      };
    });

    // Remove old circlesmap if there is one
    d3.select("div#circlesmap svg").remove();

    // update the time scale to current range
    xScale = d3.time.scale()
                    .range([0, width])
                    .domain(current_month_range);

    xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient('top');

    rScale = d3.scale.log()
                     .domain([1, 3000])
                     .range([0, 20])

    // Draw the updated circlesmap
    svg = d3.select("#circlesmap")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    country_circles = new Array();

    for(var i=0; i<data.length; i++){
      // draw each counrty separately
      country_circles[i] = svg.append("g");

      country_circles[i].selectAll("circle")
                        .data(data[i]['days'])
                        .enter()
                        .append("circle")
                        .attr("cx", function(d, i) { return xScale(d.time) })
                        .attr("cy", function(d) { return (i + 0.5) * cell_height; })
                        .attr("r", 0)
                        .style("stroke", 'none')
                        .style("fill", "#800000")
                        .style("fill-opacity", 0.5);

      country_circles[i].append("g")
                        .attr("class", "x grid")
                        .attr("transform", "translate(0," + (cell_height * (i+1)) + ")")
                        .call(xAxis
                          .ticks(d3.time.month, 1)
                          .tickFormat(d3.time.format(''))
                        );

      country_circles[i].append("text")
                         .attr("y", function() { return (cell_height * i) + margin.top; })
                         .attr("x", 0)
                         .text(data[i].country)
                         .attr("transform", "translate( -" + margin.left + ", 0)");
    }
    // end of drawing circlesmap
    
    update_month_range(current_month_range);
  };

  var init = function() {
    var that = this;
    initCanvasSize();

    d3.json("data/circles.json", function(error, data) {
      if (error) return console.warn(error);
      that.raw_data = data;
      formatting_data(data);
      update_view();
    }); 
  };

  return {
    init: init,
    initCanvasSize: initCanvasSize,
    gtd_data: function() { return gtd_data; },
    update: update_view,
    update_month_range: update_month_range
  };
};
