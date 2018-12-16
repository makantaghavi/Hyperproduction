var ipc = require('electron').ipcRenderer;

var MAX_SIZE = 200;
var MIN_SIZE = 16;

var PanelMonitorNode = function () {

  this.initPanel = function (container, componentState) {

    var data = {};

    var isDrawing = false;

    var nodeGraphContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeGraphContainer.id = "hp-graph-" + componentState.id;
    nodeGraphContainer.className = "hp-graph-container";

    var canvas = document.createElement("canvas");
    canvas.className = "panelMonitor";
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
	  var w = canvas.width;
      var h = canvas.height;
      var nSeries = Object.keys(data).length;
      var cols = Math.ceil(Math.sqrt(nSeries));
      if (w / cols < MIN_SIZE) {
        cols = Math.floor(w / MIN_SIZE);
      }
      var rows = Math.ceil(nSeries / cols);
      var uw = Math.min(w / cols, MAX_SIZE);
      var uh = Math.min(Math.max(MIN_SIZE, h / rows), MAX_SIZE);
      var huw = uw / 2;
      var huh = uh / 2;
      var i = 0;
      var x, y, v;
      g.clearRect(0, 0, w, h);
      g.font = (uw / 8) + "px sans-serif";
      g.textAlign = "center";
      for (var series in data) {
        x = i % cols * uw;
        y = Math.floor(i / cols) * uh;
        v = data[series];
        if (v > 1) {
          v = 1;
        }
        if (v < 0) {
          v = 0;
        }
        g.fillStyle = `hsl(355, 60%, ${v * 50}%)`;
        g.fillRect(x, y, uw, uh);
        g.fillStyle = "rgb(255, 255, 255)";
        g.fillText(series, x + huw, y + huh, uw);
        i++;
      }
    }
  };
};

module.exports = PanelMonitorNode;