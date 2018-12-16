var ipc = require('electron').ipcRenderer;
var MathUtil = require('hp/lib/ptlib/util/MathUtil');

var CLICK_THRESH = 8;
var SCALE = 0.8;

var PanelCurveNode = function () {

  this.initPanel = function (container, componentState) {

    var data = {};
    
    for (var k in componentState.ports.inputs) {
      data[k] = componentState.ports.inputs[k].value;
    }

    var isDrawing = false;
    var movingPoint = null;

    var nodeCurveContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeCurveContainer.id = "hp-graph-" + componentState.id;
    nodeCurveContainer.className = "hp-graph-container";

    var canvas = document.createElement("canvas");
    canvas.className = "panelCurve";
    var g = canvas.getContext("2d");
    nodeCurveContainer.appendChild(canvas);

    container.getElement()[0].appendChild(nodeCurveContainer);

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
    
    function pointComparator(a, b) {
      return a[0] - b[0];
    }
    
    function mouseMoving(e) {
      var bounds = canvas.getBoundingClientRect();
      var x = ((e.x - bounds.left));
      var y = ((e.y - bounds.top));
      var padding = (Math.min(canvas.width, canvas.height) * (1.0 - SCALE)) / 2;
      var w = canvas.width - padding - padding;
      var h = canvas.height - padding - padding;
      
      var sx = (x - padding) / w;
      var sy = 1.0 - (y - padding) / h;
      
      sx = MathUtil.clip(sx, 0, 1);
      sy = MathUtil.clip(sy, 0, 1);
      
      data.points[movingPoint][0] = sx;
      data.points[movingPoint][1] = sy;

      // TODO: Reorder the points in the list, if dragged out of order.
      data.points.sort(pointComparator);
      
      ipc.send('request-mapping-change', {
          "action": "set-port-value",
          "id": componentState.ports.inputs.points.id,
          "value": data.points
      });
      
      e.stopPropagation();
      e.preventDefault();      
    }
    
    canvas.addEventListener("mousedown", function (e) {
      var bounds = canvas.getBoundingClientRect();
      var x = ((e.x - bounds.left));
      var y = ((e.y - bounds.top));
      var padding = (Math.min(canvas.width, canvas.height) * (1.0 - SCALE)) / 2;
      var w = canvas.width - padding - padding;
      var h = canvas.height - padding - padding;
      
      var sx = (x - padding) / w;
      var sy = 1.0 - (y - padding) / h;
      var clickThresh = CLICK_THRESH / w;
      var point;
      // Find if a point is being clicked
      // Can't remive first and last points
      for (var i = 0; i < data.points.length; i++) {
        point = data.points[i];
        if (Math.abs(sx - point[0]) < clickThresh && Math.abs(sy - point[1] < clickThresh)) {
          if (e.ctrlKey && i > 0 && i < data.points.length - 1) {
            //   If ctrl, remove point
            data.points.splice(i, 1);
            ipc.send('request-mapping-change', {
              "action": "set-port-value",
              "id": componentState.ports.inputs.points.id,
              "value": data.points
            });
            break;
          }
          else {
            //   Else prepare to move point
            movingPoint = i;
            canvas.style.cursor = "move";
            canvas.addEventListener("mousemove", mouseMoving);
          }
        }
      }
      if (e.ctrlKey && movingPoint === null) {
        // Else add point
        var i = 0;
        while (data.points[i][0] < sx && i < data.points.length) {
          i++;
        }
//        if (i > 0) {
//          i--;
//        }
        // VERIFY: 0, 1 should be min and max? Certainly if we're scaling the display by min/max.
        sx = MathUtil.clip(sx, 0, 1);
        sy = MathUtil.clip(sy, 0, 1);
        data.points.splice(i, 0, [sx, sy]);
        ipc.send('request-mapping-change', {
          "action": "set-port-value",
          "id": componentState.ports.inputs.points.id,
          "value": data.points
        });
      }
    });
    
    canvas.addEventListener("mouseup", function(e) {
      canvas.removeEventListener("mousemove", mouseMoving);
      movingPoint = null;
      canvas.style.cursor = "default";
    });
    
    canvas.addEventListener("mouseout", function (e) {
      canvas.removeEventListener("mousemove", mouseMoving);
      movingPoint = null;
      canvas.style.cursor = "default";
    });

    // Graph update listener
    ipc.on('graph-update', function (evt, refcon) {
      if (refcon.id === componentState.id) {
        
        for (var k in refcon.data) {
          data[k] = refcon.data[k];
        }
        
        if (isDrawing) {
          window.requestAnimationFrame(draw);
        }
      }
    });

    function resizeCanvas(e) {
      var rect = nodeCurveContainer.getBoundingClientRect();
      canvas.width = rect.right - rect.left;
      canvas.height = rect.bottom - rect.top;
      window.requestAnimationFrame(draw);
    }

    function draw() {
      g.clearRect(0, 0, canvas.width, canvas.height);
      var padding = (Math.min(canvas.width, canvas.height) * (1.0 - SCALE)) / 2;
      var w = canvas.width - padding - padding;
      var h = canvas.height - padding - padding;
      g.strokeStyle = "#555";
      g.beginPath();
      g.moveTo(padding, padding);
      g.lineTo(padding, canvas.height - padding);
      g.lineTo(w + padding, canvas.height - padding);
      g.stroke();
      
      // TODO: Fix smoothing to match node (it's using cubic, but we only have Bezier or quadratic); the tangents shouldn't be horizontal.
      g.strokeStyle = "#FFF";
      var point;
      if (data.points && data.points.length > 0) {
        g.beginPath();
        point = data.points[0];
        g.moveTo(point[0] * w + padding, canvas.height - padding - point[1] * h);
        for (var i = 1; i < data.points.length; i++) {
          point = data.points[i];
          if (data.smooth) {
            var thirdw = (point[0] - data.points[i - 1][0]) / 3;
            g.bezierCurveTo(((data.points[i - 1][0] + thirdw) * w + padding), canvas.height - padding - data.points[i - 1][1] * h, (point[0] - thirdw) * w + padding, canvas.height - padding - point[1] * h, point[0] * w + padding, canvas.height - padding - point[1] * h);
          }
          else {
            g.lineTo(point[0] * w + padding, canvas.height - padding - point[1] * h);
          }
        }
        for (var i = 1; i < data.points.length; i++) {
          point = data.points[i];
          g.strokeRect(point[0] * w + padding - 3, canvas.height - padding - point[1] * h - 3, 6, 6);
        }
        g.stroke();
      }
      
      g.strokeStyle = "hsl(355, 30%, 30%)";
      g.beginPath();
      g.moveTo(data.input * w + padding, canvas.height - padding);
      g.lineTo(data.input * w + padding, canvas.height - padding - data.output * h);
      g.lineTo(padding, canvas.height - padding - data.output * h);
      g.stroke();
      g.fillStyle = "hsl(355, 60%, 50%)";
      g.fillRect(data.input * w + padding - 4, canvas.height - padding - data.output * h - 4, 8, 8);
    }
  };
};

module.exports = PanelCurveNode;