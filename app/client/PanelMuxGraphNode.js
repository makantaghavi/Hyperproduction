var ipc = require('electron').ipcRenderer;

var SAMPLES = 300;
var SCALE = 0.8;

var PanelMuxGraphNode = function () {

  this.initPanel = function (container, componentState) {
    var that = this;
    var data = {};

    var pdiv = null;
    var maximum = null;
    var plot = null;

    var isDrawing = false;

    var nodeGraphContainer = document.createElement('div');

    this.element = nodeGraphContainer;
    
    // where the id of the graph node is created
    nodeGraphContainer.id = "hp-graph-" + componentState.id;
    nodeGraphContainer.className = "hp-graph-container";

    var canvas = document.createElement("canvas");
    canvas.className = "panelGraph";
    var g = canvas.getContext("2d");
    nodeGraphContainer.appendChild(canvas);

    if (typeof container.getElement === 'function') {
      container.getElement()[0].appendChild(nodeGraphContainer);
    } else {
      container.appendChild(nodeGraphContainer);
    }
    
    this.destroy = function () {
      that.hide();
      nodeGraphContainer.parentElement.removeChild(nodeGraphContainer);
      ipc.removeListener('graph-update', that.graphUpdate);
      data = null;
      nodeGraphContainer = null;
      g = null;
      canvas = null;
    };

    this.hide = function () {
      // isDrawing = !container.isHidden;
      isDrawing = false;
    };

    this.show = function () {
      // isDrawing = !container.isHidden;
      isDrawing = true;
      console.log(isDrawing);
      window.requestAnimationFrame(draw);
    };

    if (typeof container.on === 'function') {
      container.on("hide", that.hide);
      container.on("show", that.show);
      container.on("destroy", that.hide);
      container.on("resize", that.resizeCanvas);
    }

    this.graphUpdate = function (evt, refcon) {
      if (refcon.id === componentState.id) {
        for (var seriesName in refcon.data) {
          if (!data.hasOwnProperty(seriesName)) {
            data[seriesName] = [0];
            // The weirdness with keys below is brought to you by not wanting new connections to scroll independently from existing ones.
            var keys = Object.keys(data);
            if (keys.length > 1) {
              data[seriesName].length = Math.max(data[keys[0]].length, data[keys[1]].length);
            }
            console.log(keys);
          }
          var memory = data[seriesName];

          memory.push(refcon.data[seriesName]);

          if (memory.length >= SAMPLES) {
            memory.shift();
          }
        }
        if (isDrawing) {
          window.requestAnimationFrame(draw);
        }
      }
    };
    
    // Graph update listener
    ipc.on('graph-update', this.graphUpdate);

    this.resizeCanvas = function (e) {
      var rect = nodeGraphContainer.getBoundingClientRect();
      canvas.width = rect.right - rect.left;
      canvas.height = rect.bottom - rect.top;
    };

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
        g.strokeStyle = "hsl(" + 360 * (j / nSeries) + ", 100%, 50%)";
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

module.exports = PanelMuxGraphNode;