/* https://github.com/krzysu/flot.tooltip */

(function ($) {   
    function init(plot) {
        var lastItem =  null;
        var opts = plot.getOptions();        
        
        function nearBy(mouseX, mouseY, seriesFilter) {
            var series = plot.getData(),
                options = plot.getOptions(),
                maxDistance = options.grid.mouseActiveRadius,
                smallestDistance = maxDistance + 1,
                item = null, foundPoint = false, i, j;

            for (i = series.length - 1; i >= 0; --i) {
                if (!seriesFilter(series[i]))
                    continue;
                
                var s = series[i],
                    axisx = s.xaxis,
                    axisy = s.yaxis,
                    points = s.datapoints.points,
                    ps = s.datapoints.pointsize,
                    mx = axisx.c2p(mouseX), // precompute some stuff to make the loop faster
                    maxx = maxDistance / axisx.scale;

                if (axisx.options.inverseTransform)
                    maxx = Number.MAX_VALUE;
                
                if (s.lines.show || s.points.show) {
                    for (j = 0; j < points.length; j += ps) {
                        var x = points[j];
                        if (x == null)
                            continue;
                        
                        if (x - mx > maxx || x - mx < -maxx)
                            continue;

                        var dx = Math.abs(axisx.p2c(x) - mouseX);
                        if (dx < smallestDistance) {
                            smallestDistance = dx;
                            item = [i, j / ps];
                        }
                    }
                }                    
                
            }

            if (item) {
                i = item[0];
                j = item[1];
                ps = series[i].datapoints.pointsize;
                point = series[i].datapoints.points.slice(j * ps, (j + 1) * ps);
                
                return { datapoint: point,
                         dataIndex: j,
                         series: series[i],
                         seriesIndex: i,
                         pageX: axisx.p2c(point[0]),
                         pageY: axisy.p2c(point[1])};
            }
            
            return null;
        }
        
        function onMouseMove(e) {                
          var offset = plot.offset();
          var x = Math.max(0, Math.min(e.pageX - offset.left, plot.width())),
              y = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));

          var item = nearBy(x, y, function (s) { return s["hoverable"] != false; });

          if (lastItem) {
            plot.unhighlight(lastItem.series, lastItem.datapoint);
            lastItem = null;
          }
          if (item) {
            item.pageX += offset.left;
            item.pageY += offset.top;
            lastItem = item;
            plot.highlight(item.series, item.datapoint, "itemtracked");
            plot.triggerRedrawOverlay();                    

            var theDate = new Date(item.datapoint[0]);
            var time = $.plot.formatDate(theDate, "%H:%M");

            var tipText = item.datapoint[1].toFixed(2) + "&permil; plkst. " + time;

            $tip.html( tipText ).css({left: item.pageX + 10, top: item.pageY + 15}).show();
          } else {
            $tip.hide().html('');
          }
        }

        function onMouseOut(e) {
          plot.unhighlight(lastItem.series, lastItem.datapoint);
          lastItem = null;
          $tip.hide().html('');
        }

        plot.hooks.bindEvents.push(function (plot, eventHolder) {
          if( $('#flotTip').length > 0 ){
            $tip = $('#flotTip');
          }
          else {
            $tip = $('<div />').attr('id', 'flotTip');
            $tip.appendTo('body').hide().css({position: 'absolute'});
            $tip.css({
              'background': '#fff',
              'z-index': '100',
              'padding': '0.4em 0.6em',
              'border-radius': '0.5em',
              'font-size': '0.8em',
              'border': '1px solid #111'
            });
          }
        eventHolder.mousemove(onMouseMove);
        eventHolder.mouseout(onMouseOut);
        });

    }

    $.plot.plugins.push({
      init: init,
    name: 'tracker',
    version: '1.0'
    });
})(jQuery);
