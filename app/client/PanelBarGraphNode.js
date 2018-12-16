var ipc = require('electron').ipcRenderer;

var MAX_BAR_WIDTH = 100;
var MIN_BAR_WIDTH = 4;
var SCALE = 0.8;

var PanelBarGraphNode = function () {

  this.initPanel = function (container, componentState) {

    var data = {};
    
    var pdiv = null;
    var maximum = null;
    var plot = null;

    var isDrawing = false;

    var nodeGraphContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeGraphContainer.id = "hp-graph-" + componentState.id;
    nodeGraphContainer.className = "hp-graph-container";

    var canvas = document.createElement("canvas");
    canvas.className = "panelGraph";
    var g = canvas.getContext("2d");
    nodeGraphContainer.appendChild(canvas);

    container.getElement()[0].appendChild(nodeGraphContainer);

    function hiding() {
      // isDrawing = !container.isHidden;
      isDrawing = false;
    }

    function showing() {
      // isDrawing = !container.isHidden;
      isDrawing = true;
      //console.log(isDrawing);
      window.requestAnimationFrame(draw);
    }

    container.on("hide", hiding);
    container.on("show", showing);
    container.on("destroy", hiding);
    container.on("resize", resizeCanvas);

    // Graph update listener
    ipc.on('graph-update', function (evt, refcon) {
      if (refcon.id === componentState.id) {
        
        data[refcon.series] = refcon.data;

        // LATER: Perhaps we indicate the min and max for each input seen?
        // How do we reset the min/max, then?
        // How do we remove inputs?
        
        if (isDrawing) {
          window.requestAnimationFrame(draw);
        }
      }
    });

    function resizeCanvas(e) {
      var rect = nodeGraphContainer.getBoundingClientRect();
      canvas.width = rect.right - rect.left;
      canvas.height = rect.bottom - rect.top;
    }

    function draw() {
      g.clearRect(0, 0, canvas.width, canvas.height);
      var hh = canvas.height / 2;
      var hw = canvas.width / 2;
      var shh = hh * SCALE;
      g.strokeStyle = "#555";
      g.beginPath();
      g.moveTo(0, hh + shh);
      g.lineTo(canvas.width, hh + shh);
      g.moveTo(0, hh);
      g.lineTo(canvas.width, hh);
      g.moveTo(0, hh - shh);
      g.lineTo(canvas.width, hh - shh);
      g.stroke();

      var j = 0, x;
      var nSeries = Object.keys(data).length;
      var w = Math.min(Math.max(MIN_BAR_WIDTH, canvas.width / nSeries), MAX_BAR_WIDTH);
      g.font = Math.max(10, (w / 8)) + "px sans-serif";
      for (var series in data) {
        x = j * w - (nSeries * w / 2) + hw;
        var memory = data[series];
        g.fillStyle = "hsl(" + 360 * (j / nSeries) + ", 100%, 50%)";
        if (series) {
          g.fillText(series, x + 2, canvas.height - hh + ((memory > 0) ? 12 : -4));
        }
        
        g.fillRect(x, canvas.height - hh, w, -memory * shh);
        
        j++;
      }
    }
  };
};

module.exports = PanelBarGraphNode;