var ipc = require('electron').ipcRenderer;
var throttle = require('hp/lib/ptlib/util/EventUtil').throttle;

var PanelFadersNode = function () {

  this.initPanel = function (container, componentState) {

    // var data = {};

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    var nodeFadersContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeFadersContainer.id = "hp-graph-" + componentState.id;
    nodeFadersContainer.className = "hp-graph-container";

    container.getElement()[0].appendChild(nodeFadersContainer);
    
    var handleUpdate = throttle(function (e) {
      var portId = e.target.dataset.port;
      if (portId) {
        ipc.send('request-mapping-change', {
          "action": "set-port-value",
          "id": portId,
          "value": e.target.value
        });
      }
    }, 100);
    
    // for output Port
    for (var port in componentState.ports.outputs) {
      var portObj = componentState.ports.outputs[port];
      var fader = document.createElement("input");
      fader.type = "range";
      fader.min = "0";
      fader.max = "1";
      fader.step = "0.01";
      fader.value = portObj.value;
      fader.id = `hp-fader-${componentState.id}-${portObj.id}`;
      fader.dataset.port = portObj.id;
      fader.dataset.label = port;
      nodeFadersContainer.appendChild(fader);
    }
    
    nodeFadersContainer.addEventListener("input", handleUpdate);

//    // Graph update listener
//    ipc.on('graph-update', function (refcon) {
//      if (refcon.id === componentState.id) {
//        
//        data[refcon.series] = refcon.data;
//
//        // LATER: Perhaps we indicate the min and max for each input seen?
//        // How do we reset the min/max, then?
//        // How do we remove inputs?
//        
//        if (isDrawing) {
//          window.requestAnimationFrame(draw);
//        }
//      }
//    });

  };
};

module.exports = PanelFadersNode;