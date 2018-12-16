var Type = require("hp/model/ports").Type;
var MapNode = require("hp/model/MapNode");
var Leap = require('leapjs');
require('hp/model/utils');


exports.LeapMotion = {
	nodetype: "LeapMotion",
	descr: "Provides a connection to attached LeapMotion device.",
	path: __filename,
	inputs: {
	},
	outputs: {
		frame: {type: Type.FLOAT, defaultValue: 0},
		pos_r_x: {type: Type.FLOAT, defaultValue: 0},
		pos_r_y: {type: Type.FLOAT, defaultValue: 0},
		pos_r_z: {type: Type.FLOAT, defaultValue: 0},
		pos_l_x: {type: Type.FLOAT, defaultValue: 0},
		pos_l_y: {type: Type.FLOAT, defaultValue: 0},
		pos_l_z: {type: Type.FLOAT, defaultValue: 0},
		vel_r_x: {type: Type.FLOAT, defaultValue: 0},
		vel_r_y: {type: Type.FLOAT, defaultValue: 0},
		vel_r_z: {type: Type.FLOAT, defaultValue: 0},
		vel_l_x: {type: Type.FLOAT, defaultValue: 0},
		vel_l_y: {type: Type.FLOAT, defaultValue: 0},
		vel_l_z: {type: Type.FLOAT, defaultValue: 0},
	},
	initFn: function(ports,state,name,emt) {
		state.controller = new Leap.Controller();
		state.controller.on("frame", function(frame) {
			state.frame = frame;
		});
		state.controller.on('connect', function() {
			console.log("Leap Connected.");
		});
		state.controller.on('disconnect', function() {
			console.log("Leap Disconnected.");
		});
		state.controller.connect();
	},
	procfn: function(ports, state, id, triggerPort, emitter) {
	},

	tick: function (ports, state, id, tickData) {
		if (state.frame) {
			ports.frame.set(state.frame.id);
			var hands = state.frame.hands;
			if (hands) {
				hands.forEach(function (hand) {
					switch (hand.type) {
						case 'right':
							ports.pos_r_x.set(hand.palmPosition[0]);
							ports.pos_r_y.set(hand.palmPosition[1]);
							ports.pos_r_z.set(hand.palmPosition[2]);
							ports.vel_r_x.set(hand.palmVelocity[0]);
							ports.vel_r_y.set(hand.palmVelocity[1]);
							ports.vel_r_z.set(hand.palmVelocity[2]);
							break;
						case 'left':
							ports.pos_l_x.set(hand.palmPosition[0]);
							ports.pos_l_y.set(hand.palmPosition[1]);
							ports.pos_l_z.set(hand.palmPosition[2]);
							ports.vel_l_x.set(hand.palmVelocity[0]);
							ports.vel_l_y.set(hand.palmVelocity[1]);
							ports.vel_l_z.set(hand.palmVelocity[2]);
							break;
					}
				});
			}
		}
	},
	destroy: function (ports, state) {
		console.log("destroying");
		state.controller.disconnect();
	},
	emitter : true,
};

exports.Distance3d = {
	nodetype: "Distance3d",
	descr: "Gives distance between two points.",
	path: __filename,
	inputs: {
		x1: {type: Type.FLOAT, defaultValue: 0},
		y1: {type: Type.FLOAT, defaultValue: 0},				
		z1: {type: Type.FLOAT, defaultValue: 0},
		x2: {type: Type.FLOAT, defaultValue: 0},
		y2: {type: Type.FLOAT, defaultValue: 0},
		z2: {type: Type.FLOAT, defaultValue: 0},
	},
	outputs: {
		distance: {type: Type.FLOAT, defaultValue: 0},
	},
	initFn: function(ports,state,name,emt) {
		
	},
	procfn: function(ports, state, id, triggerPort, emitter) {
		var x1 = ports.x1.get();
		var y1 = ports.y1.get();
		var z1 = ports.z1.get();
		var x2 = ports.x2.get();
		var y2 = ports.y2.get();
		var z2 = ports.z2.get();

		ports.distance.set(Math.abs(Math.sqrt(Math.pow(x2-x1, 2)+Math.pow(y2-y1, 2)+Math.pow(z2-z1, 2))));	
	},

	tick: function (ports, state, id, tickData) {
	},

	emitter : true,
};