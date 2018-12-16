var ipc = require('electron').ipcRenderer;

var PanelGraphNode = function() {

  this.initPanel = function(container, componentState) {

    var data = [];
    var pdiv = null;
    var maximum = null;
    var plot = null;

    var isDrawing = false;
    
    var nodeGraphContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeGraphContainer.id = "hp-graph-" + componentState.id;
    nodeGraphContainer.className = "hp-graph-container";

    container.getElement()[0].appendChild(nodeGraphContainer);

    var memory = [];

    function hiding() {
      // isDrawing = !container.isHidden;
      isDrawing = false;
    }
    
    function showing() {
      // isDrawing = !container.isHidden;
      isDrawing = true;
      window.requestAnimationFrame(redrawPlot);
    }
    
    container.on("hide", hiding);
    container.on("show", showing);
    container.on("destroy", hiding);
    
    // Graph update listener
    ipc.on('graph-update', function (evt, refcon) {
      if (refcon.id === componentState.id) {
        var data = refcon.data;

        memory.push([memory.length,data]);

        var output = [];
        if (memory.length > 298) {
          for (var i = 0; i < 299; ++i) {
            output.push([i, memory[i+1][1]]);
          }
          output.push([299, data]);
          memory = output;
        }
        if (isDrawing) {
          window.requestAnimationFrame(redrawPlot);
        }
      }
    });

    function redrawPlot() {
//      if (isDrawing) {
//        window.requestAnimationFrame(redrawPlot);
//      }
      if (plot) {
        plot.setData([memory]);
        plot.draw();
      }
    }
        
    var data = [], totalPoints = 300;

    var getData = function () {
      if (data.length > 0) {
        data = data.slice(1);
      }

      // Do a random walk

      while (data.length < totalPoints) {

        var prev = data.length > 0 ? data[data.length - 1] : 50,
          y = prev + Math.random() * 10 - 5;

        if (y < 0) {
          y = 0;
        } else if (y > 100) {
          y = 100;
        }

        data.push(y);
      }

      // Zip the generated y values with the x values

      var res = [];
      for (var i = 0; i < data.length; ++i) {
        res.push([i, data[i]]);
      }

      return res;
    };

    var initGraph = function() {
      pdiv = $(nodeGraphContainer);
      maximum = pdiv.outerWidth() / 2 || 300;

      var series = [{
        data: getData(),
        lines: {
          fill: true
        }
      }];

      plot = $.plot(pdiv, series, {
        grid: {
          borderWidth: 1,
          minBorderMargin: 10,
          labelMargin: 10,
          backgroundColor: {
            colors: ["#222", "#222"]
          },
          margin: {
            top: 8,
            bottom: 10,
            left: 10
          },
          markings: function(axes) {
            var markings = [];
            var xaxis = axes.xaxis;
            for (var x = Math.floor(xaxis.min); x < xaxis.max; x += xaxis.tickSize * 2) {
              markings.push({ xaxis: { from: x, to: x + xaxis.tickSize }, color: "rgba(35, 35, 38, 0.2)" });
            }
            return markings;
          }
        },
        xaxis: {
          tickFormatter: function() {
            return "";
          }
        },
        yaxis: {
          min: 0,
          max: 110
        },
        legend: {
          show: false
        }
      });
    };

    setTimeout(initGraph, 50);
  };
};

module.exports = PanelGraphNode;



