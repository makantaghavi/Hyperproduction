var Type = require("hp/model/ports").Type;
var ipc = require('electron').ipcMain;
var MapNode = require("hp/model/MapNode");
require('hp/model/utils');


exports.SliderWidget = {
	nodetype: "SliderWidget",
	descr: "Provides a slider UI element.",
	path: __filename,
	inputs: {
		range_low: {type: Type.FLOAT, defaultValue: 0},
		range_high: {type: Type.FLOAT, defaultValue: 1},
		in: {type: Type.FLOAT, defaultValue: 0, continuous: true}
	},
	outputs: {
		out: {type: Type.ANY, defaultValue: 0}
	},
	initFn: function(ports,state,name,emt) {
		ipc.on('widget-slider-slide', function (evtType, refcon) {
			if (refcon.id === state.id) {
				ports.out.set(refcon.value.map(0,1,Number(ports.range_low.get()), Number(ports.range_high.get())));
			}
		});
	},
	procfn: function(ports, state, id, triggerPort, emitter) {
		if (triggerPort.name === 'in') {
			ports.out.set(ports.in.get());
			if (emitter) {
				emitter.emit('widget-update', 'widget-slider-set-value', {
					"id" : id,
					"value" : Number(triggerPort.get()).map(Number(ports.range_low.get()), Number(ports.range_high.get()), 0, 1),
				});
			}
		}
	},

	tick: function (ports, state, id, tickData) {
		state.id = id; 
	},

	uiDefn: "hp/client/PanelWidgetSlider",
	emitter : true,
};