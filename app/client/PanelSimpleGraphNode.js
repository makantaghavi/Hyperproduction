var ipc = require('electron').ipcRenderer;

var SAMPLES = 300;
var SCALE = 0.8;

var PanelSimpleGraphNode = function () {

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
        
        if (!data.hasOwnProperty(refcon.series)) {
          data[refcon.series] = [0];
          // The weirdness with keys below is brought to you by not wanting new connections to scroll independently from existing ones.
          var keys = Object.keys(data);
          if (keys.length > 1) {
            data[refcon.series].length = Math.max(data[keys[0]].length, data[keys[1]].length);
          }
        }
        var memory = data[refcon.series];

        memory.push(refcon.data);

        if (memory.length >= SAMPLES) {
          memory.shift();
        }
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
      var j = 0;
      var nSeries = Object.keys(data).length;
      for (var series in data) {
        var memory = data[series];
        g.fillStyle = g.strokeStyle = "hsl(" + 360 * (j / nSeries) + ", 100%, 50%)";
        if (series) {
          g.fillText(series, 3, canvas.height - (memory[0] * shh + hh) + 3);
        }
        g.beginPath();
        g.moveTo(0, canvas.height - (memory[0] * shh + hh));
        for (var i = 1; i < memory.length; i++) {
          g.lineTo((i / SAMPLES) * canvas.width, canvas.height - (memory[i] * shh + hh));
        }
        g.stroke();
        j++;
      }
    }
  };
};

module.exports = PanelSimpleGraphNode;