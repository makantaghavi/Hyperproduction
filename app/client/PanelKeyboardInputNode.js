// var hpPath = require("path");
// var hpAppDir = hpPath.dirname(require.main.filename);

var ipc = require('electron').ipcRenderer;
// var throttle = require(hpAppDir + '/lib/ptlib/util/EventUtil').throttle;
var throttle = require('../lib/ptlib/util/EventUtil').throttle;

var PanelKeyboardInputNode = function () {

  this.initPanel = function (container, componentState) {

    // var data = {};

    // console.log("hpPath=" + hpPath + ", hpAppDir=" + hpAppDir);

    console.log("hello keybaord asdf;lkj");

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    var nodeKeyboardContainer = document.createElement('div');

    // where the id of the graph node is created
    nodeKeyboardContainer.id = "hp-graph-" + componentState.id;
    nodeKeyboardContainer.className = "hp-graph-container";

    container.getElement()[0].appendChild(nodeKeyboardContainer);
    
    // var handleUpdate = throttle(function (e) {
    //   var portId = e.target.dataset.port;
    //   if (portId) {
    //     ipc.send('request-mapping-change', {
    //       "action": "set-port-value",
    //       "id": portId,
    //       "value": e.target.value
    //     });
    //   }
    // }, 100);
    
    // for output Port
    // for (var port in componentState.ports.outputs) {
    //   var portObj = componentState.ports.outputs[port];
    //   var fader = document.createElement("input");
    //   fader.type = "range";
    //   fader.min = "0";
    //   fader.max = "1";
    //   fader.step = "0.01";
    //   fader.value = portObj.value;
    //   fader.id = `hp-fader-${componentState.id}-${portObj.id}`;
    //   fader.dataset.port = portObj.id;
    //   fader.dataset.label = port;
    //   nodeKeyboardContainer.appendChild(fader);
    // }
    
    // nodeKeyboardContainer.addEventListener("input", handleUpdate);



    // ========
    // Keyboard output ports

    for (var port in componentState.ports.outputs) {
        var portObj = componentState.ports.outputs[port];
        console.log("port " + port + "'s ID is " + portObj.id);
    }

    var isKeyDownPort = componentState.ports.outputs["isKeyDown"];
    var keyCodePort = componentState.ports.outputs["keyCode"];
    var keyCharPort = componentState.ports.outputs["keyChar"];

    // Keyboard UI

    // var keyboardFocusElement = document.createElement("div");
    // keyboardFocusElement.style.backgroundColor = "red";
    // keyboardFocusElement.style.width = "100px";
    // keyboardFocusElement.style.height = "100px";
    // nodeKeyboardContainer.appendChild(keyboardFocusElement);

    // Keyboard input field
    var keyboardInput = document.createElement("input");
    keyboardInput.type = "text";
    keyboardInput.id = `hp-keyboard-input-${componentState.id}`;
    keyboardInput.style.backgroundColor = "#550000";
    keyboardInput.style.color = "white";
    keyboardInput.style.fontSize = "36px";
    keyboardInput.style.textAlign = "center";
    keyboardInput.style.width = "75px";
    keyboardInput.style.height = "75px";
    nodeKeyboardContainer.appendChild(keyboardInput);

    // Text with info/instructions
    var infoText = document.createElement("div");
    infoText.innerHTML = "^ Please click the box above to enable keyboard input (click away from it to disable)"
    // infoText.setAttribute("style", "color: white");
    infoText.style.color = "white";
    nodeKeyboardContainer.appendChild(infoText);


    // ========
    // Keyboard listeners


    var currKeyCode = -1;

    // When input field gains/loses focus
    keyboardInput.addEventListener("focus", function(e) {
        keyboardInput.style.backgroundColor = "#004400";
    });
    keyboardInput.addEventListener("blur", function(e) {
        keyboardInput.style.backgroundColor = "#550000";
    })

    // When key is pressed down
    // nodeKeyboardContainer.addEventListener("keydown", function(e) {
    keyboardInput.addEventListener("keydown", function(e) {
        // Prevent lots of duplicate keydowns
        if (e.keyCode == currKeyCode) {
            return;
        }

        console.log("keydown: " + e.keyCode);
        currKeyCode = e.keyCode;

        // UI
        keyboardInput.value = "";
        keyboardInput.style.backgroundColor = "#2D882D";

        // Key code
        ipc.send("request-mapping-change", {
            "action": "set-port-value",
            "id": keyCodePort.id,
            "value": e.keyCode
        });

        // Key char 
        ipc.send("request-mapping-change", {
            "action": "set-port-value",
            "id": keyCharPort.id,
            "value": String.fromCharCode(e.keyCode) // TODO: Handle case sensitivity, special characters
        });

        // Key down
        ipc.send("request-mapping-change", {
            "action": "set-port-value",
            "id": isKeyDownPort.id,
            "value": true
        });
    });

    // When key is released
    // nodeKeyboardContainer.addEventListener("keyup", function(e) {
    keyboardInput.addEventListener("keyup", function(e) {
        console.log("keyup: " + e.keyCode);
        currKeyCode = -1;

        // UI
        keyboardInput.style.backgroundColor = "#004400";

        // Key code
        ipc.send("request-mapping-change", {
            "action": "set-port-value",
            "id": keyCodePort.id,
            "value": e.keyCode
        });

        // Key char 
        ipc.send("request-mapping-change", {
            "action": "set-port-value",
            "id": keyCharPort.id,
            "value": String.fromCharCode(e.keyCode) // TODO: Handle case sensitivity, special characters
        });

        // Key down
        ipc.send("request-mapping-change", {
            "action": "set-port-value",
            "id": isKeyDownPort.id,
            "value": false
        });
    });

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

module.exports = PanelKeyboardInputNode;