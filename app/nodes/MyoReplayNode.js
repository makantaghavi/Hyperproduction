var Type = require("hp/model/ports").Type;
var RunningState = require("hp/model/MapNode").RunningState;
var LineByLineReader = require('line-by-line');
var fs = require('fs');

function initfn(ports, state) {
    state.fds = []
    state.logfn = function() {
        if (state.start == 0) {
            return;
        }
        state.logStart = null;
        state.startTime = Date.now();
        state.now = state.startTime;
    }
    state.reset = function() {

    }
    state.skipTo = Date.parse("2015-03-06T23:32:48.945Z") + 519*1000;
    processfile(ports, state, 'viola-myo.log');
    //processfilesWithPrefix(ports, state, 'viola');
}

function sendObject(ports, state, obj) {
    if (obj.accelerometer) {
        if (obj.id == 1) {
            ports.accXLeft.set(obj.accelerometer.x);
            ports.accYLeft.set(obj.accelerometer.y);
            ports.accZLeft.set(obj.accelerometer.z);
            obj.hand = 'left';
            ports.accObjLeft.set(obj);
        }
        if (obj.id == 0) {
            ports.accXRight.set(obj.accelerometer.x);
            ports.accYRight.set(obj.accelerometer.y);
            ports.accZRight.set(obj.accelerometer.z);
            obj.hand = 'right';
            ports.accObjRight.set(obj);
        }
    }
    if (obj.data) {
        // emg
        if (obj.id == 1) {
            ports.emg0Left.set(obj.data[0]);
            ports.emg1Left.set(obj.data[1]);
            ports.emg2Left.set(obj.data[2]);
            ports.emg3Left.set(obj.data[3]);
            ports.emg4Left.set(obj.data[4]);
            ports.emg5Left.set(obj.data[5]);
            ports.emg6Left.set(obj.data[6]);
            ports.emg7Left.set(obj.data[7]);
            obj.hand = 'left';
        }
        if (obj.id == 0) {
            ports.emg0Right.set(obj.data[0]);
            ports.emg1Right.set(obj.data[1]);
            ports.emg2Right.set(obj.data[2]);
            ports.emg3Right.set(obj.data[3]);
            ports.emg4Right.set(obj.data[4]);
            ports.emg5Right.set(obj.data[5]);
            ports.emg6Right.set(obj.data[6]);
            ports.emg7Right.set(obj.data[7]);
            obj.hand = 'right';
        }
        ports.emgObj.set(obj);
    }
}

function processfilesWithPrefix(ports, state, prefix) {
    for (var hand in {"right" : true, "left": true}) {
        for (var datatype in {"emg": true, "accel": true}) {
            processfile(ports, state, prefix + "-" + hand + "-" + datatype + ".log");
        }
    }
}

function processfile(ports, state, filename) {
    lr = new LineByLineReader(filename);
    lr.on('error', function (err) {
        // 'err' contains error object
        // TODO: handle this
        console.log(err);
    });
    lr.on('line', function(line) {
        obj = JSON.parse(line);
        then = Date.parse(obj.timestamp);
        if (state.skipTo && then < state.skipTo) {
            return;
        }
        if (state.logStart == null) {
            state.emitter.emit('play-audio', 'play-audio', {});
            state.logStart = then;
            state.now = state.logStart;
            state.realStart = Date.now();
            state.realNow = Date.now();
        }
        diff = then - state.now;
        state.now += Date.now() - state.realNow;
        state.realNow = Date.now();

        if (diff <= 0) {
            // process now!
            sendObject(ports, state, obj);
        } else {
            // pause and send later
            lr.pause();
            setTimeout(function() {

                sendObject(ports, state, obj);

                lr.resume();
            }, diff);
        }
    });
}

function procfn(ports, state) {
    state.emitter = this.emitter
    start = ports.start.get();
    console.log(ports.filename.get());
    if (start != state.start) {
        if (start == 1) {
            // start sending files from beginning
            //state.logfn();
            //processfile(ports, state, ports.filename.get());
        } else {
            // stop replaying
            state.reset();
        }
    }
}



exports.MyoFileReplay = {
  nodetype: "MyoFileReplay",
  generator: true,
  descr: "Outputs Myo data stream from logged data file",
  path: __filename,
  initFn: initfn,
  procfn : procfn,
  inputs: {
    filename: { type : Type.STRING, defaultValue: ""},
    start: { type : Type.INT, defaultValue: 0},
  },
  outputs : {
    accXLeft : { type : Type.FLOAT, defaultValue : 0 },
    accYLeft : { type : Type.FLOAT, defaultValue : 0 },
    accZLeft : { type : Type.FLOAT, defaultValue : 0 },
    accXRight : { type : Type.FLOAT, defaultValue : 0 },
    accYRight : { type : Type.FLOAT, defaultValue : 0 },
    accZRight : { type : Type.FLOAT, defaultValue : 0 },
    accObjRight : {type : Type.OBJECT, defaultValue: {}},
    accObjLeft : {type : Type.OBJECT, defaultValue: {}},
    emg0Left : { type : Type.FLOAT, defaultValue : 0 },
    emg1Left : { type : Type.FLOAT, defaultValue : 0 },
    emg2Left : { type : Type.FLOAT, defaultValue : 0 },
    emg3Left : { type : Type.FLOAT, defaultValue : 0 },
    emg4Left : { type : Type.FLOAT, defaultValue : 0 },
    emg5Left : { type : Type.FLOAT, defaultValue : 0 },
    emg6Left : { type : Type.FLOAT, defaultValue : 0 },
    emg7Left : { type : Type.FLOAT, defaultValue : 0 },
    emg0Right : { type : Type.FLOAT, defaultValue : 0 },
    emg1Right : { type : Type.FLOAT, defaultValue : 0 },
    emg2Right : { type : Type.FLOAT, defaultValue : 0 },
    emg3Right : { type : Type.FLOAT, defaultValue : 0 },
    emg4Right : { type : Type.FLOAT, defaultValue : 0 },
    emg5Right : { type : Type.FLOAT, defaultValue : 0 },
    emg6Right : { type : Type.FLOAT, defaultValue : 0 },
    emg7Right : { type : Type.FLOAT, defaultValue : 0 },
    emgObj : {type : Type.OBJECT, defaultValue: {data:[]}},
  },
  emitter: true,
}
