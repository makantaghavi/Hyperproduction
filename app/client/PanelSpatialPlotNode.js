var ipc = require('electron').ipcRenderer;

var GRAPH_EXTENT_FACTOR = 0.8;

var PanelSpatialPlotNode = function() {

  this.initPanel = function(container, componentState) {

    var data = {px: 0, py: 0, x: 0, y: 0};

    var isDrawing = false;
    
    var canvas = document.createElement("canvas");
    canvas.className = "panelCanvas";
    var g = canvas.getContext("2d");
    g.fillStyle = "orange";
    
    var nodeGraphContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeGraphContainer.id = "hp-graph-" + componentState.id;
    nodeGraphContainer.className = "hp-graph-container";

    nodeGraphContainer.appendChild(canvas);
    container.getElement()[0].appendChild(nodeGraphContainer);
    resizeCanvas();

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
    container.on("resize", resizeCanvas);
    
    function resizeCanvas(e) {
      var rect = nodeGraphContainer.getBoundingClientRect();
      var extent = Math.min(rect.bottom - rect.top, rect.right - rect.left);
      canvas.width = canvas.height = extent;
    }
    
    // Graph update listener
    ipc.on('graph-update', function (evt, refcon) {
      if (refcon.id === componentState.id) {
        data.x = refcon.data.x;
        data.y = refcon.data.y;
        if (isDrawing) {
          window.requestAnimationFrame(redrawPlot);
        }
      }
    });

    function redrawPlot() {
//      if (isDrawing) {
//        window.requestAnimationFrame(redrawPlot);
//      }
      var hw = canvas.width / 2;
      var hh = canvas.height / 2;
      var ext = Math.min(hw, hh) * GRAPH_EXTENT_FACTOR;
      var px = hw + (data.px * ext);
      var py = hh + (-data.py * ext);
      var x = hw + (data.x * ext);
      var y = hh + (-data.y * ext);
      data.px = data.x;
      data.py = data.y;
      g.fillStyle = "rgba(0, 0, 0, 0.5)";
      g.fillRect(0, 0, canvas.width, canvas.height);
      g.strokeStyle = "#222";
      g.beginPath();
      g.moveTo(0, hh);
      g.lineTo(canvas.width, hh);
      g.moveTo(hw, 0);
      g.lineTo(hw, canvas.height);
      g.moveTo(hw, hh);
      g.arc(hw, hh, ext, 0, 2 * Math.PI);
      g.stroke();
      g.strokeStyle = "darkorange";
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(x, y);
      g.stroke();
      g.fillStyle = "yellow";
      g.fillRect(x - 2, y - 2, 4, 4);
    }

  };
};

module.exports = PanelSpatialPlotNode;
