var osc = require('osc-min');
var udp = require('dgram');

out_socket = udp.createSocket('udp4');

var buf = osc.toBuffer({
	address: "/atem/program/6",
	args: []
});

out_socket.send(buf, 0, buf.length, 3333, "10.0.1.63");