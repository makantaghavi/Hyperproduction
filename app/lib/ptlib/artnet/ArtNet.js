var udp = require('dgram');

var INSTANCES = 1;
var HEADER = [65, 114, 116, 45, 78, 101, 116, 0, 0, 80, 0, 14, 0, 0, 255, 0, 2, 0];
var HEADER_UNIVERSE_IDX = 14;
var HEADER_LENGTH_IDX = 16;

function ArtNet() {
    if (!chrome.sockets.udp) {
        throw new Error("UDP sockets not supported by platform.");
    }
    INSTANCES++;
}

//ArtNet.prototype = Object.create(EventSource.prototype);
//ArtNet.prototype.constructor = ArtNet;
//ArtNet.prototype.parent = EventSource.prototype;

ArtNet.prototype.socketId = null;
ArtNet.prototype.localAddress = "0.0.0.0";
ArtNet.prototype.localPort = 0;

// Not currently implemented
// PHYSICAL, SEQUENCE

// TODO: Receive Art-Net... a separate class?
// LATER: Discovery

ArtNet.prototype.open = function(host, port, universe, refresh) {
    this.host = host || "255.255.255.255";
    this.port = port || 6454;
    this.universe = parseInt(universe, 10) || 0;
    this.refresh = refresh || 0;

    // this.data = new Array(512).fill(0);
    this.data = new Uint8ClampedArray(512 + HEADER.length);
    this.data.set(HEADER, 0);
    this.data[HEADER_UNIVERSE_IDX] = this.universe; // UniverseLow
    this.data[HEADER_LENGTH_IDX] = Math.floor((this.data.length - HEADER.length) / 256); // LengthHigh
    this.data[HEADER_LENGTH_IDX + 1] = (this.data.length - HEADER.length) % 256; // LengthLow

    var _this = this;

    chrome.sockets.udp.create({
        persistent: false,
        name: "art-net-" + INSTANCES
    }, function(socketInfo) {
        _this.socketId = socketInfo.socketId;
        // _this.bindSocket();
    });
};

/*
 * Don't currently receive. ArtNet.prototype.bindSocket = function () { var _this = this;
 * chrome.sockets.udp.bind(this.socketId, this.localAddress, this.localPort, function (resultCode) {
 * _this.postEvent((resultCode > 0) ? "error" : "open", resultCode); console.log("Art-Net socket opened."); }); };
 */

ArtNet.prototype.close = function() {
    var _this = this;
    window.clearInterval(this.interval);
    chrome.sockets.udp.close(this.socketId, function(e) {
        _this.postEvent("close");
        console.log("Art-Net socket closed.");
    });
};

ArtNet.prototype.send = function(callback) {
    chrome.sockets.udp.send(this.socketId, this.data, this.host, this.port, callback);
};

ArtNet.prototype.set = function(channel, value, callback) {
    // channel is 1-based
    var off = HEADER.length;
    if (Array.isArray(value)) {
        this.data.set(value, off + channel - 1);
//			for (var i = 0; i < value.length; i++) {
//				this.data[off + channel + i - 1] = value[i];
//			}
    }
    else if (typeof channel === "object") {
        var id;
        for ( var k in channel) {
            id = parseInt(k, 10) - 1;
            this.data[off + id] = channel[k];
        }
        if (typeof value === "function") {
            callback = value;
        }
    }
    else {
        this.data[off + channel - 1] = value;
    }

    // This was apparently to make sure that this.data was 512 bytes, from:
    // https://github.com/hobbyquaker/artnet/blob/master/lib/artnet.js
    /*
     * var l = this.data.length; if (l > 512) { this.data.splice(0, 512); } else if (l < 512) { this.data.concat }
     */

    if (callback !== false) {
        this.send(callback);
    }
};

ArtNet.prototype.get = function(channel) {
    return this.data[HEADER.length + channel - 1];
};

exports.ArtNet = ArtNet;
