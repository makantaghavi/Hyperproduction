var ipc = require('electron').ipcRenderer;
var ColorUtil = require('hp/lib/ptlib/util/ColorUtil');

var SCALE = 0.8;

var PanelColorNode = function () {

  this.initPanel = function (container, componentState) {

    var data = {
      hsv: [0, 0, 0]
    };

    var isDrawing = false;

    var nodeGraphContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeGraphContainer.id = "hp-graph-" + componentState.id;
    nodeGraphContainer.className = "hp-graph-container panelColor";

    var canvas = document.createElement("canvas");
    // canvas.className = "panelColor";
    var g = canvas.getContext("2d");
    nodeGraphContainer.appendChild(canvas);

    var selection = document.createElement("div");
    selection.className = "panelColorSelection";
    nodeGraphContainer.appendChild(selection);
    
    container.getElement()[0].appendChild(nodeGraphContainer);

    function hiding() {
      // isDrawing = !container.isHidden;
      isDrawing = false;
    }

    function showing() {
      // isDrawing = !container.isHidden;
      isDrawing = true;
      // console.log(isDrawing);
    }

    container.on("hide", hiding);
    container.on("show", showing);
    container.on("destroy", hiding);
    container.on("resize", resizeCanvas);
    
    function mouseMoving(e) {
      // TODO: Set the value on the model based on the position.
      // Constrain position to color wheel radius.
      var bounds = canvas.getBoundingClientRect();
      var x = ((e.x - bounds.left) - canvas.width / 2);
      var y = ((e.y - bounds.top) - canvas.height / 2);
      var sat = Math.sqrt(x * x + y * y) / ((Math.min(canvas.width, canvas.height) / 2) * SCALE);
      var hue = 1.0 - Math.atan2(y, x) / (2 * Math.PI);
      while (hue < 0) {
        hue += 1.0;
      }
      if (sat > 1.0) {
        sat = 1.0;
      }
      // FIXME: Support RGB ports. Perhaps just subclass this with the appropriate conversions for RGBi/f?
      ipc.send('request-mapping-change', {
          "action": "set-port-value",
          "id": componentState.ports.inputs.hue.id,
          "value": hue
      });
      ipc.send('request-mapping-change', {
          "action": "set-port-value",
          "id": componentState.ports.inputs.saturation.id,
          "value": sat
      });
      
      e.stopPropagation();
      e.preventDefault();
    }
    
    canvas.addEventListener("mousedown", function (e) {
      canvas.addEventListener("mousemove", mouseMoving);
      mouseMoving(e);
    });
    
    canvas.addEventListener("mouseup", function () {
      canvas.removeEventListener("mousemove", mouseMoving);
    });
    
    nodeGraphContainer.addEventListener("mouseout", function () {
      canvas.removeEventListener("mousemove", mouseMoving);
    });
    
    nodeGraphContainer.addEventListener("mousewheel", function (e) {
      var value = data.hsv[2];
      if (e.shiftKey) {
        value -= Math.sign(e.deltaY) * 0.1;
      }
      else {
        value -= Math.sign(e.deltaY) * 0.05;
      }
      if (value < 0) {
        value = 0;
      }
      else if (value > 1.0) {
        value = 1.0;
      }
            
      // data.hsv[2] = value;
      
      e.stopPropagation();
      e.preventDefault();
      
      // TODO: Set the value on the model
      ipc.send('request-mapping-change', {
          "action": "set-port-value",
          "id": componentState.ports.inputs.value.id,
          "value": value
      });
    });

    // Graph update listener
    ipc.on('graph-update', function (evt, refcon) {
      if (refcon.id === componentState.id) {
        
//        data.rgb = refcon.data;
//        // TODO: Convert RGB to HSV
//		data.hsv = ColorUtil.toHSV(ColorUtil.fromRGBInt(data.rgb));
        // console.log(data.hsv);
		// console.log(refcon);
        if (typeof refcon.data.hsv !== "undefined") {
          data.hsv = refcon.data.hsv;
        }
        else if (typeof refcon.rgb !== "undefined") {
          data.hsv = ColorUtil.toHSV(refcon.data.rbg);
        }

        var bounds = nodeGraphContainer.getBoundingClientRect();
        var hh = bounds.height / 2;
        var hw = bounds.width / 2;
        var r = data.hsv[1] * SCALE * Math.min(hw, hh);
        var hue = (1.0 - data.hsv[0]) * 2 * Math.PI;
        // console.log(bounds, data.hsv, r, hue, data.hsv[2]);
        selection.style.transform = `translate(${r * Math.cos(hue)}px, ${r * Math.sin(hue)}px)`;
        canvas.style.opacity = data.hsv[2];
        
        if (isDrawing) {
          window.requestAnimationFrame(draw);
        }
      }
    });

    function resizeCanvas(e) {
      var rect = nodeGraphContainer.getBoundingClientRect();
      var w = rect.right - rect.left;
      var h = rect.bottom - rect.top;
      w = Math.min(w, h);
      canvas.width = w;
      canvas.height = w;
      data.w = w;
      data.radius = (w / 2) * SCALE;
      if (isDrawing) {
        window.requestAnimationFrame(draw);
      }
    }

    function draw() {
      g.clearRect(0, 0, canvas.width, canvas.height);
      var hh = canvas.height / 2;
      var hw = canvas.width / 2;
      var radius = data.radius;
      var counterClockwise = false;

      for(var angle = 0; angle <= 360; angle++) {
        var startAngle = (angle - 2) * Math.PI / 180;
        var endAngle = angle * Math.PI / 180;
        g.beginPath();
        g.moveTo(hw, hh);
        g.arc(hw, hh, radius, startAngle, endAngle, counterClockwise);
        g.closePath();
        g.fillStyle = "hsl(" + (360 - angle) + ", 100%, 50%)";
        g.fill();
	  }
      
      var grad = g.createRadialGradient(hw, hh, 0, hw, hh, radius);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      g.fillStyle = grad;
      // g.globalCompositeOperation = "lighter";
      g.fillRect(hw * 0.2, hh * 0.2, 2 * radius, 2 * radius);
      
      g.beginPath();
      // g.moveTo(0, 0);
      g.arc(hw, hh, radius, 0, 2 * Math.PI, counterClockwise);
      g.strokeStyle = "#CCCCCC";
      g.stroke();
    }
    
  };
};

module.exports = PanelColorNode;