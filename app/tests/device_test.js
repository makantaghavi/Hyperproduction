var Osc_Device = require("../osc_device.js");

var x32 = new Osc_Device("18.85.52.46", 10023);
console.log(x32);
x32.setState({"/ch/01/mix/fader":[{type:"float",value:2.0}]});
x32.sendUpdate();

