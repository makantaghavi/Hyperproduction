var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
var ipc = require('electron').ipcMain;
var MapNode = require("hp/model/MapNode");
var ContainerMapNode = require("hp/model/ContainerMapNode");

exports.Presets = {
    nodetype: "Presets",
    descr: "Handles Presets",
    path: __filename,
    inputs: {
        sendPreset: {
            type: Type.INTEGER,
            defaultValue: 0,
        },
        sendByLabel: {
          type: Type.STRING,
          defaultValue: "",
          continuous: true
        },
        presetData: {
            type: Type.STRING,
            defaultValue: "[[]]",
        }
    },
    outputs: {},
    initFn: function(ports, state, name, emitter) {
        state.labels = {};
        ipc.on('preset-data-changed', function(evtValue, refcon) {
            ports.presetData.set(refcon.value);
        });
        ipc.on('request-preset-data', function(evtValue, refcon) {
            if (emitter) {
                emitter.emit('preset-update', 'set-preset-data', {
                    "data": ports.presetData.get()
                });
            }
        });
    },
    procfn: function(ports, state, id, triggerPort, emitter) {
        if (emitter) {
            if (triggerPort.name == 'sendPreset') {
                emitter.emit('preset-update', "send-preset", {
                    "preset": triggerPort.get(),
                });
            }
            else if (triggerPort.name === "sendByLabel") {
              var label = ports.sendByLabel.get();
              if (label && label !== "null" && label !== "undefined") {
                if (state.labels[label]) {
                  ports.sendPreset.set(state.labels[label]);
                }
              }
            }
            else if (triggerPort.name == 'presetData') {
				var presetData = JSON.parse(ports.presetData.get());
                emitter.emit('preset-update', 'set-preset-data', {
                    "data": presetData
                });
                state.labels = {};
                var label;
                for (var i = 0; i < presetData[0].length; i++) {
                  label = presetData[0][i];
                  if (label && label !== "null") {
                    state.labels[label] = i;
                  }
                }
            }
        }
    },
    uiDefn: "hp/client/PanelPublishedPorts",
    emitter: true,
};
